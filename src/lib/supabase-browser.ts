import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createSSRBrowserClient> | null = null

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  supabaseClient = createSSRBrowserClient(url, key)

  return supabaseClient
}

export function createBrowserClient() {
  return getSupabaseClient()
}
