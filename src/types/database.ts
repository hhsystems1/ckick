export interface Project {
  id: string
  userId: string
  name: string
  template: 'nextjs' | 'node' | 'python'
  createdAt: string
  updatedAt: string
}

export interface File {
  id: string
  projectId: string
  name: string
  path: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface TaskRun {
  id: string
  projectId: string
  userId: string
  taskName: string
  status: 'pending' | 'running' | 'success' | 'failed'
  logs: string
  exitCode: number | null
  duration: number | null
  createdAt: string
  updatedAt: string
}

export interface AgentChange {
  id: string
  projectId: string
  userId: string
  filePath: string
  originalContent: string
  newContent: string
  diff: string
  summary: string
  applied: boolean
  undone: boolean
  appliedAt?: string
  undoneAt?: string
  createdAt: string
}

export interface UserSettings {
  id: string
  userId: string
  groqApiKey?: string
  claudeApiKey?: string
  openaiApiKey?: string
  minimaxApiKey?: string
  preferredModel: string
  createdAt: string
  updatedAt: string
}
