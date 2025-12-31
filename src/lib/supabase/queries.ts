import { createClient } from './client'

const supabase = createClient()

// Projects
export async function getProjectsByUserId(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })

  if (error) throw error
  return data
}

export async function getProjectById(projectId: string, userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('userId', userId)
    .single()

  if (error) throw error
  return data
}

export async function createProject(userId: string, name: string, template: string) {
  const { data, error } = await supabase
    .from('projects')
    .insert([{ userId, name, template }])
    .select()
    .single()

  if (error) throw error
  return data
}

// Files
export async function getFilesByProjectId(projectId: string) {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('projectId', projectId)
    .order('path', { ascending: true })

  if (error) throw error
  return data
}

export async function getFileById(fileId: string) {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single()

  if (error) throw error
  return data
}

export async function createFile(projectId: string, name: string, path: string, content: string) {
  const { data, error } = await supabase
    .from('files')
    .insert([{ projectId, name, path, content }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFileContent(fileId: string, content: string) {
  const { data, error } = await supabase
    .from('files')
    .update({ content, updatedAt: new Date().toISOString() })
    .eq('id', fileId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFile(fileId: string) {
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId)

  if (error) throw error
}

export async function renameFile(fileId: string, newName: string, newPath: string) {
  const { data, error } = await supabase
    .from('files')
    .update({ name: newName, path: newPath, updatedAt: new Date().toISOString() })
    .eq('id', fileId)
    .select()
    .single()

  if (error) throw error
  return data
}
