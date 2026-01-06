'use client'

import { FolderOpen, Search, Settings, Play, Code, MessageCircle } from 'lucide-react'
import clsx from 'clsx'

interface ModeSwitcherProps {
  currentMode: 'code' | 'agent' | 'terminal' | 'preview' | 'files' | 'search' | 'settings' | 'run'
  onModeChange: (mode: 'code' | 'agent' | 'terminal' | 'preview' | 'files' | 'search' | 'settings' | 'run') => void
}

const modes = [
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'agent', label: 'AI', icon: MessageCircle },
  { id: 'run', label: 'Run', icon: Play },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

export function ModeSwitcher({ currentMode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E2937] border-t border-[#4FB6A1]/20 px-2 pb-safe pt-2 z-50">
      <div className="flex justify-between items-end gap-1">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            className={clsx(
              'flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 min-w-[64px]',
              currentMode === id
                ? 'bg-[#4FB6A1]/20 text-[#4FB6A1] scale-105'
                : 'text-[#F5F7F6]/50 hover:text-[#F5F7F6] hover:bg-[#F5F7F6]/5 active:scale-95'
            )}
            title={label}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Icon size={24} strokeWidth={currentMode === id ? 2 : 1.5} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
