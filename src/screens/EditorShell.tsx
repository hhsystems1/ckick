'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/typed-client'
import { MonacoEditor } from '@/components/MonacoEditor'
import { FileExplorer } from '@/components/FileExplorer'
import { Agent } from '@/components/Agent'
import { TerminalPanel } from '@/components/TerminalPanel'
import { ArrowLeft, FolderOpen, Terminal, Bot, Rocket, Eye, Loader2 } from 'lucide-react'
import type { File } from '@/types/supabase'
import type { User } from '@supabase/supabase-js'

type PageType = 'files' | 'code' | 'terminal' | 'agent' | 'deploy' | 'preview'

const navItems = [
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'code', label: 'Code', icon: Bot },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'agent', label: 'Agent', icon: Bot },
  { id: 'deploy', label: 'Deploy', icon: Rocket },
  { id: 'preview', label: 'Preview', icon: Eye },
] as const

export default function EditorShellPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [files, setFiles] = useState<File[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<PageType>('code')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [projectName, setProjectName] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [previewPort, setPreviewPort] = useState<number | null>(null)

  const supabase = getSupabaseClient()

  useEffect(() => {
    async function initialize() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        setUser(authUser)

        if (!projectId) {
          router.push('/home')
          return
        }

        if (!authUser?.id) {
          router.push('/')
          return
        }

        const projectRes = await fetch(`/api/projects/${projectId}`)
        if (!projectRes.ok) {
          router.push('/home')
          return
        }

        const projectData = await projectRes.json()
        setProjectName(projectData.name)

        const filesRes = await fetch(`/api/files?projectId=${projectId}`)
        const filesData = await filesRes.json()
        setFiles(Array.isArray(filesData) ? filesData : [])

        if (filesData.length > 0 && !selectedFileId) {
          setSelectedFileId(filesData[0].id)
        }
      } catch (error) {
        console.error('[Editor] Failed to initialize:', error)
        router.push('/home')
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [projectId, router, selectedFileId])

  async function handleSaveFile(content: string) {
    if (!selectedFileId) return
    try {
      await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedFileId, content }),
      })
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }

  async function handleCreateFile(name: string, path: string) {
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name, path, content: '' }),
      })
      const newFile = await res.json()
      setFiles([...files, newFile])
      setSelectedFileId(newFile.id)
      setCurrentPage('code')
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }

  async function handleDeleteFile(fileId: string) {
    try {
      await fetch(`/api/files?id=${fileId}`, { method: 'DELETE' })
      setFiles(files.filter((f) => f.id !== fileId))
      if (selectedFileId === fileId) {
        setSelectedFileId(files[0]?.id || null)
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  async function handleRenameFile(fileId: string, newName: string, newPath: string) {
    try {
      const res = await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fileId, name: newName, path: newPath }),
      })
      const updated = await res.json()
      setFiles(files.map((f) => (f.id === fileId ? updated : f)))
    } catch (error) {
      console.error('Failed to rename file:', error)
    }
  }

  async function handleTerminalCommand(command: string) {
    try {
      const res = await fetch('/api/sandbox/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, command }),
      })
      return await res.json()
    } catch (error) {
      return { output: String(error), exitCode: 1 }
    }
  }

  async function handleInstall() {
    try {
      const res = await fetch('/api/sandbox/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      return await res.json()
    } catch (error) {
      return { success: false, output: String(error) }
    }
  }

  async function handleDev() {
    try {
      const res = await fetch('/api/sandbox/dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      setPreviewPort(data.port || null)
      return data.port || null
    } catch {
      return null
    }
  }

  async function handleBuild() {
    try {
      const res = await fetch('/api/sandbox/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      return await res.json()
    } catch (error) {
      return { success: false, output: String(error) }
    }
  }

  async function handleDeploy() {
    if (deploying) return
    
    setDeploying(true)
    setDeployUrl(null)
    
    try {
      const fileContent: Record<string, string> = {}
      files.forEach((f) => {
        fileContent[f.path] = f.content
      })
      
      const res = await fetch('/api/deploy/netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, files: fileContent }),
      })
      
      const data = await res.json()
      if (data.success && data.url) {
        setDeployUrl(data.url)
      }
    } catch (error) {
      console.error('Deployment error:', error)
    } finally {
      setDeploying(false)
    }
  }

  const selectedFile = files.find((f) => f.id === selectedFileId)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#4FB6A1] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#F5F7F6]/50">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1419] flex flex-col">
      <header className="bg-[#1E2937] border-b border-[#4FB6A1]/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/home')}
            className="p-2 hover:bg-[#F5F7F6]/10 rounded-lg transition active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowLeft size={22} className="text-[#F5F7F6]" />
          </button>
          <div>
            <h1 className="font-bold text-[#F5F7F6]">{projectName}</h1>
            <p className="text-xs text-[#F5F7F6]/50">{files.length} files</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentPage === 'deploy' && deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-[#4FB6A1] text-sm hover:underline"
            >
              View Site
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {currentPage === 'files' && (
          <div className="flex-1">
            <FileExplorer
              files={files}
              selectedFileId={selectedFileId}
              onSelectFile={(fileId) => {
                setSelectedFileId(fileId)
                setCurrentPage('code')
              }}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
            />
          </div>
        )}

        {currentPage === 'code' && (
          <div className="flex-1 flex flex-col">
            {selectedFile ? (
              <div className="flex-1">
                <MonacoEditor
                  initialContent={selectedFile.content}
                  fileName={selectedFile.name}
                  onSave={handleSaveFile}
                  onChange={() => {}}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Bot size={48} className="mx-auto text-[#4FB6A1] mb-4 opacity-50" />
                  <p className="text-[#F5F7F6]/40">Select a file to edit</p>
                  <button
                    onClick={() => setCurrentPage('files')}
                    className="mt-4 px-4 py-2 bg-[#4FB6A1] text-[#0F1419] rounded-lg text-sm"
                  >
                    Browse Files
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPage === 'terminal' && (
          <TerminalPanel
            projectId={projectId}
            onRunCommand={handleTerminalCommand}
            onInstall={handleInstall}
            onDev={handleDev}
            onBuild={handleBuild}
          />
        )}

        {currentPage === 'agent' && (
          <Agent
            projectId={projectId}
            userId={user?.id || ''}
            onFileChange={async () => {
              const filesRes = await fetch(`/api/files?projectId=${projectId}`)
              const filesData = await filesRes.json()
              setFiles(Array.isArray(filesData) ? filesData : [])
            }}
            onApplyPatch={async (path: string, content: string) => {
              const file = files.find((f) => f.path === path)
              if (file) {
                await fetch('/api/files', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: file.id, content }),
                })
              }
            }}
          />
        )}

        {currentPage === 'deploy' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <Rocket size={64} className="mx-auto text-[#4FB6A1] mb-4" />
              <h2 className="text-xl font-bold text-[#F5F7F6] mb-2">Deploy to Netlify</h2>
              <p className="text-[#F5F7F6]/60 mb-6">
                One-click deployment to Netlify. Your site will be live in minutes.
              </p>
              <button
                onClick={handleDeploy}
                disabled={deploying}
                className="px-6 py-3 bg-[#4FB6A1] text-[#0F1419] rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {deploying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    Deploying...
                  </span>
                ) : (
                  'Deploy Now'
                )}
              </button>
              {deployUrl && (
                <div className="mt-6 p-4 bg-[#1E2937] rounded-lg">
                  <p className="text-[#F5F7F6]/60 mb-2">Your site is live!</p>
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4FB6A1] hover:underline break-all"
                  >
                    {deployUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {currentPage === 'preview' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <Eye size={64} className="mx-auto text-[#4FB6A1] mb-4" />
              <h2 className="text-xl font-bold text-[#F5F7F6] mb-2">Live Preview</h2>
              <p className="text-[#F5F7F6]/60 mb-6">
                {previewPort
                  ? `Dev server running on port ${previewPort}`
                  : 'Start the dev server to preview your app'}
              </p>
              {!previewPort && (
                <button
                  onClick={handleDev}
                  className="px-6 py-3 bg-[#4FB6A1] text-[#0F1419] rounded-lg font-medium hover:opacity-90 transition"
                >
                  Start Dev Server
                </button>
              )}
              {previewPort && (
                <a
                  href={`http://localhost:${previewPort}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-[#4FB6A1] text-[#0F1419] rounded-lg font-medium hover:opacity-90 transition"
                >
                  Open Preview
                </a>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="bg-[#1E2937] border-t border-[#4FB6A1]/20">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as PageType)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
                  isActive
                    ? 'text-[#4FB6A1] bg-[#4FB6A1]/10'
                    : 'text-[#F5F7F6]/60 hover:text-[#F5F7F6]'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Icon size={24} />
                <span className="text-xs">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
