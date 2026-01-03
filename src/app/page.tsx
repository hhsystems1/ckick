'use client'

import { useState } from 'react'
import { Header } from '@/app/components/Header'
import { SignInModal } from '@/components/auth/SignInModal'
import { useAuth } from '@/components/auth/AuthProvider'
import { ArrowRight, Zap, Shield, GitBranch, FileCode, Terminal } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading } = useAuth()
  const [showSignIn, setShowSignIn] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main>
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <img
                src="/logo.png"
                alt="Rivryn"
                className="w-64 h-auto mx-auto mb-6"
              />
              <h1 className="text-5xl font-bold text-textPrimary mb-4">
                Mobile-first IDE for cleaner code
              </h1>
              <p className="text-xl text-textSecondary max-w-2xl mx-auto">
                Build applications with an AI-powered agent, diff-based edits, and automated quality gates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowSignIn(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accentHover text-bg font-semibold rounded-lg transition"
              >
                Get Started
                <ArrowRight size={18} />
              </button>
              <Link
                href={user ? '/home' : '#'}
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault()
                    setShowSignIn(true)
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-borderSoft hover:bg-surfaceSoft text-textPrimary font-medium rounded-lg transition"
              >
                {user ? 'Go to Dashboard' : 'View Demo'}
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 border-t border-borderSoft">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-textPrimary text-center mb-12">
              Everything you need to build better applications
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<GitBranch size={24} />}
                title="Diff-based Edits"
                description="Review every change before applying. AI proposes edits, you approve or discard. No surprises."
              />
              <FeatureCard
                icon={<Zap size={24} />}
                title="AI Coding Agent"
                description="Describe what you want to build and let AI handle the implementation. Powered by Groq, Claude, or your preferred model."
              />
              <FeatureCard
                icon={<Shield size={24} />}
                title="Quality Gates"
                description="Automatic testing, linting, and formatting on every change. Keep your codebase clean and consistent."
              />
              <FeatureCard
                icon={<FileCode size={24} />}
                title="Full IDE Features"
                description="Syntax highlighting, multiple file support, and project templates for Next.js, Node.js, and Python."
              />
              <FeatureCard
                icon={<Terminal size={24} />}
                title="Built-in Terminal"
                description="Run commands, execute tests, and manage your project without leaving the browser."
              />
              <FeatureCard
                icon={<Shield size={24} />}
                title="Secure by Default"
                description="Your code stays yours. Local-first architecture with Supabase for secure authentication."
              />
            </div>
          </div>
        </section>

        <section className="py-16 px-4 border-t border-borderSoft">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-textPrimary mb-4">
              Ready to build better applications?
            </h2>
            <p className="text-textSecondary mb-8">
              Start coding with AI assistance today. No credit card required.
            </p>
            <button
              onClick={() => setShowSignIn(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent hover:bg-accentHover text-bg font-semibold rounded-lg transition"
            >
              Get Started Free
              <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 border-t border-borderSoft">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-textMuted">
            Rivryn - Built with Next.js, Supabase, and AI
          </p>
          <div className="flex items-center gap-6 text-sm text-textMuted">
            <a href="#" className="hover:text-textPrimary transition">Privacy</a>
            <a href="#" className="hover:text-textPrimary transition">Terms</a>
            <a href="#" className="hover:text-textPrimary transition">GitHub</a>
          </div>
        </div>
      </footer>

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={() => {
          setShowSignIn(false)
          window.location.href = '/home'
        }}
      />
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-surface border border-borderSoft rounded-xl p-6 hover:border-accent/50 transition group">
      <div className="w-12 h-12 bg-surfaceSoft rounded-lg flex items-center justify-center mb-4 text-accent group-hover:bg-accent group-hover:text-bg transition">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-textPrimary mb-2">{title}</h3>
      <p className="text-textSecondary text-sm">{description}</p>
    </div>
  )
}
