'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { Play, Square, RotateCcw, Download, Upload } from 'lucide-react'

interface TerminalPanelProps {
  projectId: string
  onRunCommand: (command: string) => Promise<{ output: string; exitCode: number | null }>
  onInstall?: () => Promise<{ success: boolean; output: string }>
  onDev?: () => Promise<number | null>
  onBuild?: () => Promise<{ success: boolean; output: string }>
}

export function TerminalPanel({
  projectId,
  onRunCommand,
  onInstall,
  onDev,
  onBuild,
}: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
      theme: {
        background: '#0F1419',
        foreground: '#F5F7F6',
        cursor: '#4FB6A1',
        selectionBackground: 'rgba(79, 182, 161, 0.3)',
        black: '#1E2937',
        red: '#FF6B6B',
        green: '#4FB6A1',
        yellow: '#FFD93D',
        blue: '#4D96FF',
        magenta: '#9B59B6',
        cyan: '#00D9FF',
        white: '#F5F7F6',
      },
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      cursorBlink: true,
      cursorStyle: 'bar',
      allowTransparency: true,
      scrollback: 1000,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    fitAddon.fit()

    term.writeln('\x1b[32m❯\x1b[0m Welcome to Ckick Terminal')
    term.writeln('\x1b[32m❯\x1b[0m Type commands or use the action buttons below')
    term.writeln('')

    const handleData = (data: string) => {
      if (data === '\r') {
        const line = currentLineRef.current
        if (line.trim()) {
          setHistory((prev) => [...prev, line.trim()])
          setHistoryIndex(-1)
        }
        executeCommand(line)
        currentLineRef.current = ''
      } else if (data === '\x7F') {
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1)
          term.write('\b \b')
        }
      } else if (data === '\x1b[A') {
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1
          setHistoryIndex(newIndex)
          const histItem = history[history.length - 1 - newIndex]
          currentLineRef.current = histItem
          term.write(`\r\x1b[2K${prompt}${histItem}`)
        }
      } else if (data === '\x1b[B') {
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          const histItem = history[history.length - 1 - newIndex]
          currentLineRef.current = histItem
          term.write(`\r\x1b[2K${prompt}${histItem}`)
        } else if (historyIndex === 0) {
          setHistoryIndex(-1)
          currentLineRef.current = ''
          term.write(`\r\x1b[2K${prompt} `)
        }
      } else if (data === '\x03') {
        term.writeln('^C')
        term.write(`\r\n${prompt} `)
      } else if (data.length === 1 && data >= ' ' && data <= '~') {
        currentLineRef.current += data
        term.write(data)
      }
    }

    term.onData(handleData)

    const handleResize = () => fitAddon.fit()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [projectId])

  const currentLineRef = useRef('')
  const prompt = '\x1b[32m❯\x1b[0m '

  const executeCommand = async (command: string) => {
    if (!xtermRef.current) return

    xtermRef.current.write('\r\n')

    if (!command.trim()) {
      xtermRef.current.write(prompt)
      return
    }

    setIsRunning(true)
    try {
      const result = await onRunCommand(command)
      if (result.output) {
        xtermRef.current.writeln(result.output.replace(/\n/g, '\r\n'))
      }
      if (result.exitCode && result.exitCode !== 0) {
        xtermRef.current.writeln(`\x1b[31mExit code: ${result.exitCode}\x1b[0m`)
      }
    } catch (error) {
      xtermRef.current.writeln(`\x1b[31mError: ${error}\x1b[0m`)
    } finally {
      setIsRunning(false)
      xtermRef.current.write(prompt)
    }
  }

  const handleInstall = async () => {
    if (!xtermRef.current || !onInstall) return
    xtermRef.current.writeln('\r\n\x1b[33mRunning npm install...\x1b[0m\r\n')
    setIsRunning(true)
    try {
      const result = await onInstall()
      if (result.success) {
        xtermRef.current.writeln('\x1b[32m✓ Dependencies installed successfully\x1b[0m')
      } else {
        xtermRef.current.writeln(`\x1b[31m✗ Installation failed: ${result.output}\x1b[0m`)
      }
    } catch (error) {
      xtermRef.current.writeln(`\x1b[31m✗ Error: ${error}\x1b[0m`)
    } finally {
      setIsRunning(false)
      xtermRef.current.write(prompt)
    }
  }

  const handleDev = async () => {
    if (!xtermRef.current || !onDev) return
    xtermRef.current.writeln('\r\n\x1b[33mStarting development server...\x1b[0m\r\n')
    setIsRunning(true)
    try {
      const port = await onDev()
      if (port) {
        xtermRef.current.writeln(`\x1b[32m✓ Dev server running on port ${port}\x1b[0m`)
      } else {
        xtermRef.current.writeln('\x1b[31m✗ Failed to start dev server\x1b[0m')
      }
    } catch (error) {
      xtermRef.current.writeln(`\x1b[31m✗ Error: ${error}\x1b[0m`)
    } finally {
      setIsRunning(false)
      xtermRef.current.write(prompt)
    }
  }

  const handleBuild = async () => {
    if (!xtermRef.current || !onBuild) return
    xtermRef.current.writeln('\r\n\x1b[33mBuilding project...\x1b[0m\r\n')
    setIsRunning(true)
    try {
      const result = await onBuild()
      if (result.success) {
        xtermRef.current.writeln('\x1b[32m✓ Build completed successfully\x1b[0m')
      } else {
        xtermRef.current.writeln(`\x1b[31m✗ Build failed: ${result.output}\x1b[0m`)
      }
    } catch (error) {
      xtermRef.current.writeln(`\x1b[31m✗ Error: ${error}\x1b[0m`)
    } finally {
      setIsRunning(false)
      xtermRef.current.write(prompt)
    }
  }

  const clearTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.clear()
      xtermRef.current.writeln(prompt)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#0F1419]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1E2937] border-b border-[#4FB6A1]/20">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#F5F7F6]">Terminal</span>
          {isRunning && <span className="text-xs text-[#4FB6A1] animate-pulse">Running...</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleInstall}
            disabled={isRunning}
            className="p-1.5 hover:bg-[#4FB6A1]/20 rounded transition disabled:opacity-50"
            title="Install Dependencies"
          >
            <Download size={16} className="text-[#4FB6A1]" />
          </button>
          <button
            onClick={handleDev}
            disabled={isRunning}
            className="p-1.5 hover:bg-[#4FB6A1]/20 rounded transition disabled:opacity-50"
            title="Start Dev Server"
          >
            <Play size={16} className="text-[#4FB6A1]" />
          </button>
          <button
            onClick={handleBuild}
            disabled={isRunning}
            className="p-1.5 hover:bg-[#4FB6A1]/20 rounded transition disabled:opacity-50"
            title="Build Project"
          >
            <Square size={16} className="text-[#4FB6A1]" />
          </button>
          <button
            onClick={clearTerminal}
            className="p-1.5 hover:bg-[#4FB6A1]/20 rounded transition"
            title="Clear"
          >
            <RotateCcw size={16} className="text-[#4FB6A1]" />
          </button>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 p-2 overflow-hidden" style={{ minHeight: 200 }} />
    </div>
  )
}
