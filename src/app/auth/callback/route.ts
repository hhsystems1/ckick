import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // For now, we'll just redirect to the home page
  // We'll handle the auth exchange on the client side
  // This is a simpler approach that avoids server-side cookie issues
  
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
