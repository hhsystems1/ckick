import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export interface ValidationResult {
  valid: boolean
  error?: string
  status: number
}

export async function validateProjectOwnership(
  projectId: string,
  userId: string
): Promise<ValidationResult> {
  if (!projectId || !userId) {
    return { valid: false, error: 'Missing projectId or userId', status: 400 }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (error || !data) {
      return { valid: false, error: 'Project not found or access denied', status: 403 }
    }

    return { valid: true, status: 200 }
  } catch (err) {
    console.error('Project validation error:', err)
    return { valid: false, error: 'Validation error', status: 500 }
  }
}

export async function validateFileAccess(
  fileId: string,
  userId: string
): Promise<ValidationResult> {
  if (!fileId || !userId) {
    return { valid: false, error: 'Missing fileId or userId', status: 400 }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('project_id')
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      return { valid: false, error: 'File not found', status: 404 }
    }

    const fileData = file as { project_id: string }
    const ownershipCheck = await validateProjectOwnership(fileData.project_id, userId)
    if (!ownershipCheck.valid) {
      return { valid: false, error: 'Access denied to file', status: 403 }
    }

    return { valid: true, status: 200 }
  } catch (err) {
    console.error('File validation error:', err)
    return { valid: false, error: 'Validation error', status: 500 }
  }
}

export async function validateFileOwnershipByPath(
  projectId: string,
  filePath: string,
  userId: string
): Promise<ValidationResult> {
  if (!projectId || !filePath || !userId) {
    return { valid: false, error: 'Missing required parameters', status: 400 }
  }

  try {
    const ownershipCheck = await validateProjectOwnership(projectId, userId)
    if (!ownershipCheck.valid) {
      return ownershipCheck
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('files')
      .select('id')
      .eq('project_id', projectId)
      .eq('path', filePath)
      .single()

    if (error && error.code !== 'PGRST116') {
      return { valid: false, error: 'File lookup failed', status: 500 }
    }

    return { valid: true, status: 200 }
  } catch (err) {
    console.error('File validation error:', err)
    return { valid: false, error: 'Validation error', status: 500 }
  }
}

export async function getUserBySession(request: NextRequest): Promise<{ userId: string | null; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { userId: null, error: 'Invalid or expired session' }
    }

    return { userId: user.id }
  } catch {
    return { userId: null, error: 'Auth validation failed' }
  }
}

export function createAuthErrorResponse(message: string, status: number = 401) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
