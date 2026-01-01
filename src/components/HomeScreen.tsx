'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  template: string
  createdAt: string
}

export function HomeScreen() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('nextjs')
  const [creating, setCreating] = useState(false)

  const userId = user?.id

  useEffect(() => {
    if (userId) {
      loadProjects(userId)
    }
  }, [userId])

  async function loadProjects(uid: string) {
    try {
      const res = await fetch(`/api/projects?userId=${uid}`)
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProject() {
    if (!newProjectName.trim() || !userId) return

    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: newProjectName,
          template: selectedTemplate,
        }),
      })

      if (!res.ok) throw new Error('Failed to create project')

      const newProject = await res.json()
      setProjects([newProject, ...projects])
      setNewProjectName('')
      setShowNewProject(false)
      window.location.href = `/editor/${newProject.id}`
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="pb-32">
      <div className="max-w-full px-4 py-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-surface rounded-2xl p-6 border border-borderSoft">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-accent mb-2">AI Agent</h2>
                <p className="text-textSecondary mb-4 text-sm">
                  Edit code with diffs, apply changes, and undo with confidence
                </p>
              </div>
              <div className="w-10 h-10 bg-surfaceSoft rounded-lg flex items-center justify-center">
                <Plus size={20} className="text-textSecondary" />
              </div>
            </div>
            <Link
              href={projects[0] ? `/editor/${projects[0].id}` : '#'}
              className={`inline-block mt-2 text-sm text-accent hover:underline ${!projects[0] ? 'pointer-events-none opacity-50' : ''}`}
            >
              Open in Editor →
            </Link>
          </div>

          <div className="bg-surface rounded-2xl p-6 border border-borderSoft">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-accent mb-2">IDE</h2>
                <p className="text-textSecondary mb-4 text-sm">
                  Code editor with terminal, tasks, and quality gates
                </p>
              </div>
              <div className="w-10 h-10 bg-surfaceSoft rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-textSecondary">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-textMuted mt-2">
              Create a project to start coding
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-textPrimary mb-4">Recent Projects</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface rounded-xl p-4 border border-borderSoft animate-pulse">
                  <div className="h-5 bg-surfaceSoft rounded w-1/3 mb-2" />
                  <div className="h-4 bg-surfaceSoft rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-2xl border border-borderSoft">
              <div className="w-16 h-16 bg-surfaceSoft rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={24} className="text-textMuted" />
              </div>
              <h3 className="text-lg font-medium text-textPrimary mb-2">No projects yet</h3>
              <p className="text-textSecondary text-sm mb-4">Create your first project to get started</p>
              <button
                onClick={() => setShowNewProject(true)}
                className="px-4 py-2 bg-accent hover:bg-accentHover text-bg font-medium rounded-lg transition"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/editor/${project.id}`}
                  className="block bg-surface rounded-xl p-4 border border-borderSoft hover:border-accent hover:bg-surfaceSoft transition group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-textPrimary group-hover:text-accent transition">
                        {project.name}
                      </h3>
                      <p className="text-sm text-textMuted capitalize mt-1">
                        {project.template}
                      </p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-textMuted group-hover:text-accent transition">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowNewProject(true)}
        className="fixed bottom-8 right-4 bg-accent hover:bg-accentHover text-bg rounded-full p-4 shadow-lg transition z-20"
      >
        <Plus size={24} />
      </button>

      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 z-30 flex flex-col items-end" onClick={() => setShowNewProject(false)}>
          <div
            className="bg-surface w-full max-w-md rounded-b-3xl p-6 space-y-4 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-textPrimary">New Project</h2>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Awesome Project"
                className="w-full px-4 py-2 bg-surfaceSoft border border-borderSoft rounded-lg text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">Template</label>
              <div className="space-y-2">
                {[
                  { id: 'nextjs', name: 'Next.js', desc: 'React framework for web' },
                  { id: 'node', name: 'Node.js', desc: 'JavaScript runtime' },
                  { id: 'python', name: 'Python', desc: 'General purpose programming' },
                ].map((tmpl) => (
                  <label
                    key={tmpl.id}
                    className="flex items-center p-3 border border-borderSoft rounded-lg cursor-pointer hover:bg-surfaceSoft transition"
                  >
                    <input
                      type="radio"
                      name="template"
                      value={tmpl.id}
                      checked={selectedTemplate === tmpl.id}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="mr-3 accent-accent"
                    />
                    <div>
                      <span className="text-textPrimary capitalize">{tmpl.name}</span>
                      <p className="text-xs text-textMuted">{tmpl.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setShowNewProject(false)}
                className="flex-1 px-4 py-2 border border-borderSoft rounded-lg text-textPrimary hover:bg-surfaceSoft transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
                className="flex-1 px-4 py-2 bg-accent hover:bg-accentHover text-bg font-medium rounded-lg transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
