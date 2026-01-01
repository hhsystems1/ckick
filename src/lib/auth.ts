import { createClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error('Supabase environment variables not configured')
    }
    
    supabaseInstance = createClient(url, key)
  }
  
  return supabaseInstance
}

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
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('userId', userId)
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
    const supabase = getSupabase()
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('projectId')
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      return { valid: false, error: 'File not found', status: 404 }
    }

    const fileData = file as { projectId: string }
    const ownershipCheck = await validateProjectOwnership(fileData.projectId, userId)
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

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('files')
      .select('id')
      .eq('projectId', projectId)
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

export async function getUserBySession(request: Request): Promise<{ userId: string | null; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')

    if (!authHeader && !cookieHeader) {
      return { userId: null, error: 'No auth credentials' }
    }

    const supabase = getSupabase()
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
