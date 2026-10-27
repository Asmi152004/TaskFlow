import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import { getError } from '../utils/helpers'

export default function Projects() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get('/projects')
      .then((res) => setProjects(res.data.projects))
      .catch((error) => toast.error(getError(error)))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Please enter a project name')

    setSaving(true)
    try {
      const { data } = await api.post('/projects', form)
      toast.success('Project created')
      navigate(`/projects/${data.project._id}`)
    } catch (error) {
      toast.error(getError(error))
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">Everything you own or have been invited to.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ New project</button>
      </div>

      {loading ? (
        <Spinner label="Loading projects..." />
      ) : projects.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <p className="font-medium text-slate-900">No projects yet</p>
          <p className="mt-1 text-sm text-slate-500">Create your first project to start adding tasks.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">Create a project</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const isOwner = project.owner?._id === user.id
            const percent = project.totalTasks ? Math.round((project.counts.done / project.totalTasks) * 100) : 0
            return (
              <Link key={project._id} to={`/projects/${project._id}`} className="card block p-5 transition hover:border-indigo-300 hover:shadow">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-slate-900">{project.name}</h2>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${isOwner ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {isOwner ? 'Owner' : 'Member'}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">{project.description || 'No description'}</p>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{project.counts.done} of {project.totalTasks} tasks done</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  {project.memberCount} member{project.memberCount !== 1 ? 's' : ''} · Owner: {project.owner?.name}
                </p>
              </Link>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal title="New project" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Project name</label>
              <input id="name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} placeholder="e.g. Website Redesign" autoFocus />
            </div>
            <div>
              <label className="label" htmlFor="description">Description</label>
              <textarea id="description" rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} placeholder="What is this project about? (optional)" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create project'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
