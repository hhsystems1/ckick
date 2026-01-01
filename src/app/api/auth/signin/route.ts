import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }
  
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) throw error

    return NextResponse.json({
      message: 'Magic link sent to your email',
      email,
    })
  } catch (error) {
    console.error('POST /api/auth/signin:', error)
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 })
  }
}
