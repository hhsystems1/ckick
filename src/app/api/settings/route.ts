import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { validateRequestSize } from '@/lib/payload-limit'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { getUserBySession, createAuthErrorResponse } from '@/lib/auth'
import { events, captureException } from '@/lib/telemetry'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
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

    const { data, error } = await getSupabase()
      .from('user_settings')
      .select('groqApiKey, claudeApiKey, openaiApiKey, minimaxApiKey, preferredModel')
      .eq('userId', userId)
      .single()
    
    if (error || !data) {
      return NextResponse.json({
        groqApiKey: null,
        claudeApiKey: null,
        openaiApiKey: null,
        minimaxApiKey: null,
        preferredModel: 'groq',
      })
    }
    
    return NextResponse.json({
      groqApiKey: data.groqApiKey ? '[SET]' : null,
      claudeApiKey: data.claudeApiKey ? '[SET]' : null,
      openaiApiKey: data.openaiApiKey ? '[SET]' : null,
      minimaxApiKey: data.minimaxApiKey ? '[SET]' : null,
      preferredModel: data.preferredModel,
    })
  } catch (error) {
    console.error('GET /api/settings:', error)
    captureException(error as Error, { tags: { endpoint: 'settings', method: 'GET' } })
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sizeCheck = validateRequestSize(request)
    if (!sizeCheck.valid) {
      return new Response(JSON.stringify({ error: sizeCheck.error }), { status: 413 })
    }

    const { userId, error: authError } = await getUserBySession(request)
    if (authError || !userId) {
      return createAuthErrorResponse(authError || 'Authentication required', 401)
    }

    const rateLimitResponse = await rateLimitMiddleware(request, userId, 'settings')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { groqApiKey, claudeApiKey, openaiApiKey, minimaxApiKey, preferredModel } = body

    if (body.userId && body.userId !== userId) {
      return NextResponse.json({ error: 'Cannot modify other user settings' }, { status: 403 })
    }

    const validProviders = ['groq', 'claude', 'openai', 'minimax']
    const provider = validProviders.includes(preferredModel || '') ? (preferredModel || 'groq') : 'groq'

    const updates: Record<string, string | null | undefined> = {
      userId,
      preferredModel: provider,
      updatedAt: new Date().toISOString(),
    }
    
    if (groqApiKey !== undefined) updates.groqApiKey = groqApiKey || null
    if (claudeApiKey !== undefined) updates.claudeApiKey = claudeApiKey || null
    if (openaiApiKey !== undefined) updates.openaiApiKey = openaiApiKey || null
    if (minimaxApiKey !== undefined) updates.minimaxApiKey = minimaxApiKey || null

    const { data, error } = await getSupabase()
      .from('user_settings')
      .upsert([updates])
      .select()
      .single()
    
    if (error) throw error

    events.settingsUpdated({
      userId,
      provider: updates.preferredModel || 'groq',
    })
    
    return NextResponse.json({
      success: true,
      preferredModel: data.preferredModel,
    })
  } catch (error) {
    console.error('PUT /api/settings:', error)
    captureException(error as Error, { tags: { endpoint: 'settings', method: 'PUT' } })
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
