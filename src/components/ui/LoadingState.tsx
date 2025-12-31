'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: number | string
  height?: number | string
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-surfaceSoft'

  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl',
  }

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  }

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  )
}

export function ProjectListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton variant="text" width={120} height={24} className="mb-4" />
      <div className="p-4 bg-surface rounded-xl border border-borderSoft">
        <Skeleton variant="text" width="75%" height={20} />
        <Skeleton variant="text" width={100} height={14} className="mt-2" />
      </div>
      <div className="p-4 bg-surface rounded-xl border border-borderSoft">
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width={100} height={14} className="mt-2" />
      </div>
      <div className="p-4 bg-surface rounded-xl border border-borderSoft">
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width={100} height={14} className="mt-2" />
      </div>
    </div>
  )
}

export function FileTreeSkeleton() {
  return (
    <div className="space-y-1 p-2">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton variant="text" width="50%" height={16} />
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton variant="text" width="70%" height={16} />
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton variant="text" width="40%" height={16} />
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton variant="text" width="60%" height={16} />
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton variant="text" width="30%" height={16} />
      </div>
    </div>
  )
}

export function EditorSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-1 p-2 border-b border-borderSoft">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" width={100} height={32} />
        ))}
      </div>
      <div className="flex-1 p-4 space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} variant="text" width={`${50 + Math.random() * 45}%`} height={18} />
        ))}
      </div>
    </div>
  )
}

export function AgentChatSkeleton() {
  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <div className="flex justify-start">
        <Skeleton variant="rectangular" width={200} height={60} className="rounded-lg" />
      </div>
      <div className="flex justify-start">
        <div className="max-w-[80%] space-y-2">
          <Skeleton variant="text" width={150} height={16} />
          <Skeleton variant="rectangular" width="100%" height={100} className="rounded-lg" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton variant="rectangular" width={180} height={44} className="rounded-lg" />
      </div>
    </div>
  )
}

export function LoadingSpinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn('animate-spin border-2 border-surfaceSoft border-t-accent rounded-full', className)}
      style={{ width: size, height: size }}
    />
  )
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <LoadingSpinner size={40} className="mb-4" />
      <p className="text-textSecondary text-sm">{message}</p>
    </div>
  )
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-textMuted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-textMuted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-textMuted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

export function LoadingBar({ progress, className }: { progress?: number; className?: string }) {
  return (
    <div className={cn('w-full h-1 bg-surfaceSoft rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-accent transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress || 0))}%` }}
      />
    </div>
  )
}
