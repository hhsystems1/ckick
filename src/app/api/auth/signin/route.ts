import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Send magic link
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
