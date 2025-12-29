import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/', '/auth/callback']

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  
  // Create a simple Supabase client for middleware
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // For now, we'll skip auth check in middleware and handle it in components
  // This is a simpler approach that avoids cookie handling issues in middleware
  
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
