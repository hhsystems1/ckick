'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-browser'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshUser() {
    try {
      const supabase = getSupabaseClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()

    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
  }

  async function signOut() {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
