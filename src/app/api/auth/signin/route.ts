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
    const { email, password, isSignUp } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const supabase = getSupabase()

    if (isSignUp) {
      // Sign up new user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${request.headers.get('origin')}/auth/callback`,
        },
      })

      if (error) throw error

      // Auto sign in after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      return NextResponse.json({
        message: 'Account created successfully',
        user: data.user,
      })
    } else {
      // Sign in existing user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return NextResponse.json({
        message: 'Signed in successfully',
        user: data.user,
      })
    }
    } catch (error) {
    console.error('POST /api/auth/signin:', error)
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    )
  }
}
