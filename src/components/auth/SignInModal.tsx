'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { X, Mail, Check, AlertCircle } from 'lucide-react'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function SignInModal({ isOpen, onClose, onSuccess }: SignInModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleClose = useCallback(() => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setMessage('')
    setIsSignUp(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword, isSignUp }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Authentication failed')
        return
      }

      if (isSignUp) {
        setMessage('Account created! Signing you in...')
      }

      // Give user a moment to see success message, then call onSuccess
      setTimeout(() => {
        onSuccess?.()
      }, 500)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-surface border border-borderSoft rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 text-textMuted hover:text-textPrimary transition"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-textPrimary mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-textSecondary">
            {isSignUp ? 'Sign up to start building projects' : 'Sign in to continue building'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="modal-email" className="block text-sm font-medium text-textPrimary mb-2">
              Email
            </label>
            <input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              className="w-full px-4 py-2.5 bg-surfaceSoft border border-borderSoft rounded-lg text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent disabled:opacity-50 transition"
            />
          </div>

          <div>
            <label htmlFor="modal-password" className="block text-sm font-medium text-textPrimary mb-2">
              Password
            </label>
            <input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
              className="w-full px-4 py-2.5 bg-surfaceSoft border border-borderSoft rounded-lg text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent disabled:opacity-50 transition"
            />
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="modal-confirm-password" className="block text-sm font-medium text-textPrimary mb-2">
                Confirm Password
              </label>
              <input
                id="modal-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
                className="w-full px-4 py-2.5 bg-surfaceSoft border border-borderSoft rounded-lg text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent disabled:opacity-50 transition"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || (isSignUp && !confirmPassword)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accentHover text-bg font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              <>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setConfirmPassword('')
              setError('')
            }}
            disabled={loading}
            className="text-sm text-textSecondary hover:text-accent transition disabled:opacity-50"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-error/20 border border-error/30 rounded-lg text-error text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 p-3 bg-success/20 border border-success/30 rounded-lg text-success text-sm flex items-center gap-2">
            <Check size={16} />
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
