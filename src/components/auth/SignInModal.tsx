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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<'form' | 'success'>('form')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleClose = useCallback(() => {
    setEmail('')
    setError('')
    setMessage('')
    setStep('form')
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
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send magic link')
        return
      }

      setStep('success')
      onSuccess?.()
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

        {step === 'form' ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-textPrimary mb-2">Welcome to Rivryn</h2>
              <p className="text-textSecondary">Sign in to start building projects</p>
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

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accentHover text-bg font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Send Magic Link
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-error/20 border border-error/30 rounded-lg text-error text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <p className="mt-4 text-xs text-textMuted text-center">
              No password required. We&apos;ll send you a secure magic link.
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-success" />
            </div>
            <h3 className="text-xl font-bold text-textPrimary mb-2">Check your email</h3>
            <p className="text-textSecondary mb-4">
              We sent a magic link to <span className="text-accent">{email}</span>
            </p>
            <p className="text-sm text-textMuted">
              Click the link in the email to sign in.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-4 py-2 text-sm text-textSecondary hover:text-textPrimary transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
