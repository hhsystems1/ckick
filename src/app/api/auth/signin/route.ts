import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, isSignUp } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    if (isSignUp) {
      // Sign up new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${request.headers.get('origin')}/auth/callback`,
        },
      })

      if (signUpError) throw signUpError

      // Auto sign in after signup to set session cookies
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return NextResponse.json({
        message: 'Account created successfully',
        user: data.user,
        session: data.session,
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
        session: data.session,
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
