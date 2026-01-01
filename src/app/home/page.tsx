'use client'

import { useRouter } from 'next/navigation'
import { Header } from '@/app/components/Header'
import { HomeScreen } from '@/components/HomeScreen'
import { useAuth } from '@/components/auth/AuthProvider'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <HomeScreen />
    </div>
  )
}
