import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { getUserBySession, createAuthErrorResponse } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { userId, error: authError } = await getUserBySession(request)
    
    if (authError || !userId) {
      return createAuthErrorResponse(authError || 'Authentication required', 401)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: project, error } = await supabase
      .from('projects')
      .select('id, name, template, user_id, created_at, updated_at')
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('GET /api/projects/[projectId]:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('GET /api/projects/[projectId]:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}
