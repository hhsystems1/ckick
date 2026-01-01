import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, isSignUp }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Authentication failed')
        return
      }

      if (isSignUp) {
        setMessage('Account created! Signing you in...')
      }

      // Redirect to home page after successful login
      router.push('/')
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Rivryn</h1>
          <p className="text-textSecondary mb-8">Mobile-first IDE for cleaner code</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-textPrimary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="w-full px-4 py-2 bg-surfaceSoft border border-borderSoft rounded-lg text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-textPrimary mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
                className="w-full px-4 py-2 bg-surfaceSoft border border-borderSoft rounded-lg text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full px-4 py-2 bg-accent hover:bg-accentHover text-textPrimary font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
              className="text-sm text-textSecondary hover:text-accent transition disabled:opacity-50"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {error && <div className="mt-4 p-3 bg-error/20 border border-error rounded-lg text-error text-sm">{error}</div>}
          {message && <div className="mt-4 p-3 bg-success/20 border border-success rounded-lg text-success text-sm">{message}</div>}
        </div>
      </div>
    </div>
  )
}
