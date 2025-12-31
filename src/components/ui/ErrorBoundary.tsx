'use client'

import { Component, ReactNode } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { captureException } from '@/lib/telemetry'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: 'page' | 'section' | 'component'
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = Math.random().toString(36).substring(7)
    return { hasError: true, error, errorId }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)

    if (this.props.level !== 'component') {
      captureException(error, {
        extra: {
          componentStack: errorInfo?.componentStack,
          errorId: this.state?.errorId,
        },
        tags: {
          level: this.props.level || 'section',
        },
      })
    }

    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-xl border border-borderSoft">
          <AlertTriangle size={48} className="text-error mb-4" />
          <h3 className="text-lg font-semibold text-textPrimary mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-textSecondary mb-4 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accentHover text-bg rounded-lg transition"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          {this.state.errorId && (
            <p className="text-xs text-textMuted mt-4">
              Error ID: {this.state.errorId}
            </p>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

interface AsyncErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface AsyncErrorBoundaryProps {
  children: (refetch: () => void) => ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}

export class AsyncErrorBoundary extends Component<
  Omit<AsyncErrorBoundaryProps, 'children'> & { children: ReactNode }
> {
  state: AsyncErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): AsyncErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    captureException(error, {
      tags: { level: 'async' },
    })
    this.props.onError?.(error)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-borderSoft">
          <AlertTriangle size={32} className="text-error mb-3" />
          <p className="text-sm text-textSecondary mb-3">
            Failed to load content
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accentHover text-bg rounded text-sm transition"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
