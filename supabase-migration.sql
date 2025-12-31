-- Rivryn Database Schema for Supabase

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  template text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Files Table
CREATE TABLE IF NOT EXISTS public.files (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  path text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Task Runs Table
CREATE TABLE IF NOT EXISTS public.task_runs (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  logs text DEFAULT '',
  exit_code integer,
  duration integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.task_runs ENABLE ROW LEVEL SECURITY;

-- Agent Changes Table
CREATE TABLE IF NOT EXISTS public.agent_changes (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  original_content text NOT NULL,
  new_content text NOT NULL,
  diff text NOT NULL,
  summary text NOT NULL,
  applied boolean DEFAULT false,
  undone boolean DEFAULT false,
  applied_at timestamp with time zone,
  undone_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agent_changes ENABLE ROW LEVEL SECURITY;

-- User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  groq_api_key text,
  claude_api_key text,
  openai_api_key text,
  minimax_api_key text,
  preferred_model text DEFAULT 'groq',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Projects
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Files
CREATE POLICY "Users can view files in their projects"
  ON public.files FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create files in their projects"
  ON public.files FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files in their projects"
  ON public.files FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files in their projects"
  ON public.files FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Task Runs
CREATE POLICY "Users can view their task runs"
  ON public.task_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create task runs"
  ON public.task_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their task runs"
  ON public.task_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for Agent Changes
CREATE POLICY "Users can view their agent changes"
  ON public.agent_changes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create agent changes"
  ON public.agent_changes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their agent changes"
  ON public.agent_changes FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for User Settings
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

CREATE INDEX idx_files_project_id ON public.files(project_id);
CREATE INDEX idx_files_project_path ON public.files(project_id, path);

CREATE INDEX idx_task_runs_project_id ON public.task_runs(project_id);
CREATE INDEX idx_task_runs_user_id ON public.task_runs(user_id);

CREATE INDEX idx_agent_changes_project_id ON public.agent_changes(project_id);
CREATE INDEX idx_agent_changes_user_id ON public.agent_changes(user_id);
CREATE INDEX idx_agent_changes_applied ON public.agent_changes(applied, undone) WHERE applied = true AND undone = false;
CREATE INDEX idx_agent_changes_created_at ON public.agent_changes(created_at DESC);

CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);
