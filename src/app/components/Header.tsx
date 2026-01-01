'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SignInModal } from '@/components/auth/SignInModal'
import { useAuth } from '@/components/auth/AuthProvider'
import { User, LogOut } from 'lucide-react'

interface HeaderProps {
  showAuthButton?: boolean
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <img
        src="/logo.png"
        alt="Rivryn"
        className="h-20 w-auto group-hover:opacity-90 transition"
      />
    </Link>
  )
}

export function Header({ showAuthButton = true }: HeaderProps) {
  const { user, loading, signOut } = useAuth()
  const [showSignIn, setShowSignIn] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  async function handleSignOut() {
    await signOut()
    setShowUserMenu(false)
    window.location.href = '/'
  }

  if (loading) {
    return (
      <header className="bg-surface border-b border-borderSoft sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo />
          <div className="w-8 h-8 bg-surfaceSoft rounded-full animate-pulse" />
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="bg-surface border-b border-borderSoft sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo />

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/home"
                className="px-3 py-1.5 text-sm text-textSecondary hover:text-textPrimary transition"
              >
                My Projects
              </Link>
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surfaceSoft hover:bg-borderSoft rounded-lg transition"
                >
                  <User size={16} className="text-textSecondary" />
                  <span className="text-sm text-textPrimary">
                    {user.email?.split('@')[0] || 'User'}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-borderSoft rounded-lg shadow-lg py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-textSecondary hover:text-textPrimary hover:bg-surfaceSoft transition"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            showAuthButton && (
              <button
                onClick={() => setShowSignIn(true)}
                className="px-4 py-1.5 bg-accent hover:bg-accentHover text-bg text-sm font-medium rounded-lg transition"
              >
                Sign In
              </button>
            )
          )}
        </div>
      </header>

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={() => {
          setShowSignIn(false)
          window.location.href = '/home'
        }}
      />
    </>
  )
}
