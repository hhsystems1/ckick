import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { validateRequestSize, validateFileContent, sanitizeFilePath } from '@/lib/payload-limit'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { validateProjectOwnership, getUserBySession, createAuthErrorResponse } from '@/lib/auth'
import { events, captureException } from '@/lib/telemetry'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }
  
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    const sizeCheck = validateRequestSize(request)
    if (!sizeCheck.valid) {
      return new Response(JSON.stringify({ error: sizeCheck.error }), { status: 413 })
    }

    const { userId, error: authError } = await getUserBySession(request)
    if (authError || !userId) {
      return createAuthErrorResponse(authError || 'Authentication required', 401)
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    console.log('[GET /api/files] userId:', userId, 'projectId:', projectId)

    if (!projectId) {
      console.log('[GET /api/files] Missing projectId, returning 400')
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }

    const ownershipCheck = await validateProjectOwnership(projectId, userId)
    console.log('[GET /api/files] ownershipCheck:', ownershipCheck)
    
    if (!ownershipCheck.valid) {
      return new Response(JSON.stringify({ error: ownershipCheck.error }), { status: ownershipCheck.status })
    }

    const rateLimitResponse = await rateLimitMiddleware(request, userId, 'file')
    if (rateLimitResponse) return rateLimitResponse

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('files')
      .select('id, name, path, content, updated_at')
      .eq('project_id', projectId)
      .order('path', { ascending: true })

    console.log('[GET /api/files] Supabase query:', { dataCount: data?.length, error })

    if (error) {
      console.error('[GET /api/files] Supabase error:', error)
      throw error
    }

    events.fileUpdated({ projectId, path: 'file_list', userId })

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('GET /api/files:', error)
    captureException(error as Error, { tags: { endpoint: 'files', method: 'GET' } })
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sizeCheck = validateRequestSize(request)
    if (!sizeCheck.valid) {
      return new Response(JSON.stringify({ error: sizeCheck.error }), { status: 413 })
    }

    const { userId, error: authError } = await getUserBySession(request)
    if (authError || !userId) {
      return createAuthErrorResponse(authError || 'Authentication required', 401)
    }

    const rateLimitResponse = await rateLimitMiddleware(request, userId, 'file')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { projectId, name, path, content } = body

    console.log('[POST /api/files] body:', { projectId, name, path, userId })

    if (!projectId || !name || !path) {
      console.log('[POST /api/files] Missing required fields:', { projectId, name, path })
      return NextResponse.json({ error: 'Missing required fields: projectId, name, path' }, { status: 400 })
    }

    const ownershipCheck = await validateProjectOwnership(projectId, userId)
    console.log('[POST /api/files] ownershipCheck:', ownershipCheck)
    
    if (!ownershipCheck.valid) {
      return new Response(JSON.stringify({ error: ownershipCheck.error }), { status: ownershipCheck.status })
    }

    const sanitizedPath = sanitizeFilePath(path)
    if (!sanitizedPath) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    if (content !== undefined) {
      const contentValidation = validateFileContent(content)
      if (!contentValidation.valid) {
        return new Response(JSON.stringify({ error: contentValidation.error }), { status: 413 })
      }
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('files')
      .insert([{ project_id: projectId, name, path: sanitizedPath, content: content || '' }])
      .select()
      .single()

    console.log('[POST /api/files] Insert result:', { data, error })

    if (error) {
      console.error('[POST /api/files] Supabase error:', error)
      throw error
    }

    events.fileCreated({ projectId, path: sanitizedPath, userId })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/files:', error)
    captureException(error as Error, { tags: { endpoint: 'files', method: 'POST' } })
    return NextResponse.json({ error: 'Failed to create file' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sizeCheck = validateRequestSize(request)
    if (!sizeCheck.valid) {
      return new Response(JSON.stringify({ error: sizeCheck.error }), { status: 413 })
    }

    const { userId, error: authError } = await getUserBySession(request)
    if (authError || !userId) {
      return createAuthErrorResponse(authError || 'Authentication required', 401)
    }

    const rateLimitResponse = await rateLimitMiddleware(request, userId, 'file')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { id, content, name, path } = body

    if (!id) {
      return NextResponse.json({ error: 'File id required' }, { status: 400 })
    }

    if (content !== undefined) {
      const contentValidation = validateFileContent(content)
      if (!contentValidation.valid) {
        return new Response(JSON.stringify({ error: contentValidation.error }), { status: 413 })
      }
    }

    const updates: Record<string, string> = { updated_at: new Date().toISOString() }
    if (content !== undefined) updates.content = content
    if (name !== undefined) updates.name = name
    if (path !== undefined) {
      const sanitizedPath = sanitizeFilePath(path)
      if (!sanitizedPath) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
      }
      updates.path = sanitizedPath
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    events.fileUpdated({ projectId: data.project_id, path: data.path, userId })

    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH /api/files:', error)
    captureException(error as Error, { tags: { endpoint: 'files', method: 'PATCH' } })
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sizeCheck = validateRequestSize(request)
    if (!sizeCheck.valid) {
      return new Response(JSON.stringify({ error: sizeCheck.error }), { status: 413 })
    }

    const { userId, error: authError } = await getUserBySession(request)
    if (authError || !userId) {
      return createAuthErrorResponse(authError || 'Authentication required', 401)
    }

    const rateLimitResponse = await rateLimitMiddleware(request, userId, 'file')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'File id required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: fileData, error: fileLookupError } = await supabase
      .from('files')
      .select('project_id, path')
      .eq('id', id)
      .single()

    if (fileLookupError) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const ownershipCheck = await validateProjectOwnership(fileData.project_id, userId)
    if (!ownershipCheck.valid) {
      return new Response(JSON.stringify({ error: ownershipCheck.error }), { status: ownershipCheck.status })
    }

    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', id)

    if (error) throw error

    events.fileDeleted({ projectId: fileData.project_id, path: fileData.path, userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/files:', error)
    captureException(error as Error, { tags: { endpoint: 'files', method: 'DELETE' } })
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
