'use client'

import { Code, MessageCircle, Terminal, Eye } from 'lucide-react'
import clsx from 'clsx'

interface ModeSwitcherProps {
  currentMode: 'code' | 'agent' | 'terminal' | 'preview'
  onModeChange: (mode: 'code' | 'agent' | 'terminal' | 'preview') => void
}

const modes = [
  { id: 'code', label: 'Code', icon: Code },
  { id: 'agent', label: 'Agent', icon: MessageCircle },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'preview', label: 'Preview', icon: Eye },
] as const

export function ModeSwitcher({ currentMode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-borderSoft px-4 py-2 z-50">
      <div className="flex justify-around items-center gap-1">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            className={clsx(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition',
              currentMode === id
                ? 'bg-accent/20 text-accent'
                : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceSoft'
            )}
            title={label}
          >
            <Icon size={18} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
