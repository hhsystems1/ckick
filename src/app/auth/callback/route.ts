import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.redirect(new URL('/?error=auth_failed', requestUrl.origin))
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/?error=auth_failed', requestUrl.origin))
    }

    return NextResponse.redirect(new URL('/home', requestUrl.origin))
  }

  return NextResponse.redirect(new URL('/?error=no_code', requestUrl.origin))
}
