export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      files: {
        Row: {
          id: string
          name: string
          path: string
          content: string
          project_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          path: string
          content?: string
          project_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          path?: string
          content?: string
          project_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string
          template: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_id: string
          template?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string
          template?: string
          created_at?: string
          updated_at?: string
        }
      }
      agent_changes: {
        Row: {
          id: string
          user_id: string
          project_id: string
          file_path: string
          original_content: string
          new_content: string
          diff: string
          summary: string
          applied: boolean
          undone: boolean
          applied_at: string | null
          undone_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          file_path: string
          original_content: string
          new_content: string
          diff: string
          summary: string
          applied?: boolean
          undone?: boolean
          applied_at?: string | null
          undone_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          file_path?: string
          original_content?: string
          new_content?: string
          diff?: string
          summary?: string
          applied?: boolean
          undone?: boolean
          applied_at?: string | null
          undone_at?: string | null
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          groq_api_key: string | null
          claude_api_key: string | null
          openai_api_key: string | null
          minimax_api_key: string | null
          preferred_model: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          groq_api_key?: string | null
          claude_api_key?: string | null
          openai_api_key?: string | null
          minimax_api_key?: string | null
          preferred_model?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          groq_api_key?: string | null
          claude_api_key?: string | null
          openai_api_key?: string | null
          minimax_api_key?: string | null
          preferred_model?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type File = Database['public']['Tables']['files']['Row']
export type FileInsert = Database['public']['Tables']['files']['Insert']
export type FileUpdate = Database['public']['Tables']['files']['Update']

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type AgentChange = Database['public']['Tables']['agent_changes']['Row']
export type AgentChangeInsert = Database['public']['Tables']['agent_changes']['Insert']
export type AgentChangeUpdate = Database['public']['Tables']['agent_changes']['Update']

export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert']
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']

export type User = Database['public']['Tables']['users']['Row']
