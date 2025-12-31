'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, Folder, Plus, X } from 'lucide-react'

interface File {
  id: string
  name: string
  path: string
  content: string
}

interface FileExplorerProps {
  files: File[]
  selectedFileId: string | null
  onSelectFile: (fileId: string) => void
  onCreateFile?: (name: string, path: string) => Promise<void>
  onDeleteFile?: (fileId: string) => Promise<void>
  onRenameFile?: (fileId: string, newName: string, newPath: string) => Promise<void>
}

export function FileExplorer({
  files,
  selectedFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))
  const [showCreateFile, setShowCreateFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null)
  const [renamingName, setRenamingName] = useState('')

  // Group files by folder
  const buildTree = () => {
    const tree: Record<string, File[]> = {}
    files.forEach((file) => {
      const dir = file.path.substring(0, file.path.lastIndexOf('/')) || 'root'
      if (!tree[dir]) tree[dir] = []
      tree[dir].push(file)
    })
    return tree
  }

  const tree = buildTree()

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder)
    } else {
      newExpanded.add(folder)
    }
    setExpandedFolders(newExpanded)
  }

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !onCreateFile) return
    try {
      await onCreateFile(newFileName, `/${newFileName}`)
      setNewFileName('')
      setShowCreateFile(false)
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }

  const handleRenameFile = async (fileId: string) => {
    if (!renamingName.trim() || !onRenameFile) return
    try {
      await onRenameFile(fileId, renamingName, `/${renamingName}`)
      setRenamingFileId(null)
      setRenamingName('')
    } catch (error) {
      console.error('Failed to rename file:', error)
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface border-r border-borderSoft overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-borderSoft">
        <h3 className="font-semibold text-textPrimary text-sm">Files</h3>
        <button
          onClick={() => setShowCreateFile(true)}
          className="p-1 hover:bg-surfaceSoft rounded transition"
          title="Create file"
        >
          <Plus size={16} className="text-textSecondary" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 p-2">
        {showCreateFile && (
          <div className="flex items-center gap-1 mb-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="file.ts"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile()
                if (e.key === 'Escape') setShowCreateFile(false)
              }}
              autoFocus
              className="flex-1 px-2 py-1 text-sm bg-surfaceSoft border border-borderSoft rounded text-textPrimary placeholder-textMuted focus:outline-none"
            />
            <button
              onClick={handleCreateFile}
              className="p-1 hover:bg-accent hover:text-bg rounded transition"
            >
              <Plus size={14} />
            </button>
          </div>
        )}

        {Object.entries(tree).map(([folder, fileList]) => (
          <div key={folder}>
            {folder !== 'root' && (
              <div
                onClick={() => toggleFolder(folder)}
                className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-surfaceSoft rounded transition text-textSecondary text-sm"
              >
                {expandedFolders.has(folder) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Folder size={14} />
                <span>{folder}</span>
              </div>
            )}

            {(folder === 'root' || expandedFolders.has(folder)) && (
              <div className={folder !== 'root' ? 'ml-4' : ''}>
                {fileList.map((file) => (
                  <div key={file.id}>
                    {renamingFileId === file.id ? (
                      <div className="flex items-center gap-1 px-2 py-1 mb-1">
                        <input
                          type="text"
                          value={renamingName}
                          onChange={(e) => setRenamingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameFile(file.id)
                            if (e.key === 'Escape') setRenamingFileId(null)
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 text-sm bg-surfaceSoft border border-borderSoft rounded text-textPrimary focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => onSelectFile(file.id)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition truncate ${
                          selectedFileId === file.id
                            ? 'bg-accent/20 text-accent'
                            : 'text-textSecondary hover:bg-surfaceSoft hover:text-textPrimary'
                        }`}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          setRenamingFileId(file.id)
                          setRenamingName(file.name)
                        }}
                      >
                        <FileText size={14} className="flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        {selectedFileId === file.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteFile?.(file.id)
                            }}
                            className="ml-auto p-0.5 hover:bg-error/20 rounded transition"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
