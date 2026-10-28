import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import Spinner from '../components/Spinner'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import { PRIORITIES, STATUSES, getError } from '../utils/helpers'

export default function ProjectBoard() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', priority: '', assignee: '' })
  const [modal, setModal] = useState(null) // { task, status } when the task modal is open
  const [dragOver, setDragOver] = useState('')
  const [memberEmail, setMemberEmail] = useState('')

  // Load the project and its tasks
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [projectRes, tasksRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/tasks`, { params: { limit: 200 } }),
        ])
        if (cancelled) return
        setProject(projectRes.data.project)
        setIsOwner(projectRes.data.isOwner)
        setTasks(tasksRes.data.tasks)
      } catch (error) {
        toast.error(getError(error))
        navigate('/projects')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id, navigate])

  // Search and filters (applied in the browser for instant feedback)
  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false
        if (filters.priority && task.priority !== filters.priority) return false
        if (filters.assignee === 'me' && task.assignee?._id !== user.id) return false
        if (filters.assignee === 'unassigned' && task.assignee) return false
        if (filters.assignee && !['me', 'unassigned'].includes(filters.assignee) && task.assignee?._id !== filters.assignee) return false
        return true
      }),
    [tasks, filters, user.id]
  )

  // Mirrors the permission rules enforced by the API
  const canEdit = (task) => isOwner || task.createdBy?._id === user.id || task.assignee?._id === user.id
  const canDelete = (task) => isOwner || task.createdBy?._id === user.id

  // Moves a task to another column. The screen updates immediately and is rolled back if the server refuses.
  const moveTask = async (taskId, newStatus) => {
    const task = tasks.find((t) => t._id === taskId)
    if (!task || task.status === newStatus || !canEdit(task)) return

    const previous = tasks
    setTasks(tasks.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)))

    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status: newStatus })
      setTasks((current) => current.map((t) => (t._id === taskId ? data.task : t)))
    } catch (error) {
      setTasks(previous)
      toast.error(getError(error))
    }
  }

  const handleDrop = (e, status) => {
    e.preventDefault()
    setDragOver('')
    moveTask(e.dataTransfer.getData('text/plain'), status)
  }

  const handleSaved = (saved) =>
    setTasks((current) =>
      current.some((t) => t._id === saved._id) ? current.map((t) => (t._id === saved._id ? saved : t)) : [saved, ...current]
    )

  const handleDeleted = (taskId) => setTasks((current) => current.filter((t) => t._id !== taskId))

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!memberEmail.trim()) return
    try {
      const { data } = await api.post(`/projects/${id}/members`, { email: memberEmail })
      setProject(data.project)
      setMemberEmail('')
      toast.success('Member added')
    } catch (error) {
      toast.error(getError(error))
    }
  }

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${member.name} from this project?`)) return
    try {
      const { data } = await api.delete(`/projects/${id}/members/${member._id}`)
      setProject(data.project)
      // Their tasks become unassigned on the server, so mirror that here
      setTasks((current) => current.map((t) => (t.assignee?._id === member._id ? { ...t, assignee: null } : t)))
      toast.success('Member removed')
    } catch (error) {
      toast.error(getError(error))
    }
  }

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all of its tasks? This cannot be undone.')) return
    try {
      await api.delete(`/projects/${id}`)
      toast.success('Project deleted')
      navigate('/projects')
    } catch (error) {
      toast.error(getError(error))
    }
  }

  if (loading) return <Spinner label="Loading board..." />
  if (!project) return null

  return (
    <div>
      <Link to="/projects" className="text-sm text-slate-500 hover:text-indigo-600">&larr; All projects</Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          {project.description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal({ task: null, status: 'todo' })} className="btn-primary">+ New task</button>
          {isOwner && <button onClick={handleDeleteProject} className="btn-secondary text-red-600">Delete project</button>}
        </div>
      </div>

      {/* Team */}
      <div className="card mt-5 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-slate-700">Team</span>
          {project.members.map((member) => (
            <span key={member._id} className="flex items-center gap-1.5 rounded-full bg-slate-50 py-1 pl-1 pr-3 text-sm text-slate-700">
              <Avatar name={member.name} size="sm" />
              {member.name}
              {member._id === project.owner._id && <span className="text-xs text-indigo-600">(owner)</span>}
              {isOwner && member._id !== project.owner._id && (
                <button onClick={() => handleRemoveMember(member)} aria-label={`Remove ${member.name}`} className="ml-1 text-slate-400 hover:text-red-600">&times;</button>
              )}
            </span>
          ))}
        </div>

        {isOwner && (
          <form onSubmit={handleAddMember} className="flex gap-2">
            <input type="email" className="input w-56" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="Add member by email" />
            <button type="submit" className="btn-secondary">Add</button>
          </form>
        )}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <input className="input w-full sm:w-64" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search tasks..." />
        <select className="input w-auto capitalize" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input w-auto" value={filters.assignee} onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}>
          <option value="">Everyone</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
          {project.members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
        {(filters.search || filters.priority || filters.assignee) && (
          <button onClick={() => setFilters({ search: '', priority: '', assignee: '' })} className="text-sm text-indigo-600 hover:underline">Clear filters</button>
        )}
      </div>

      {/* Board */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {STATUSES.map((column) => {
          const columnTasks = visibleTasks.filter((t) => t.status === column.key)
          return (
            <div
              key={column.key}
              onDragOver={(e) => { e.preventDefault(); setDragOver(column.key) }}
              onDragLeave={() => setDragOver('')}
              onDrop={(e) => handleDrop(e, column.key)}
              className={`rounded-xl border p-3 transition ${dragOver === column.key ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-100/60'}`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                  {column.label}
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{columnTasks.length}</span>
                </h2>
                <button onClick={() => setModal({ task: null, status: column.key })} aria-label={`Add task to ${column.label}`} className="rounded p-1 text-lg leading-none text-slate-400 hover:bg-white hover:text-indigo-600">+</button>
              </div>

              <div className="min-h-[4rem] space-y-3">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    canEdit={canEdit(task)}
                    onOpen={(t) => setModal({ task: t, status: t.status })}
                    onStatusChange={moveTask}
                  />
                ))}
                {columnTasks.length === 0 && <p className="px-1 py-4 text-center text-xs text-slate-400">No tasks here</p>}
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <TaskModal
          projectId={id}
          members={project.members}
          task={modal.task}
          defaultStatus={modal.status}
          canEdit={modal.task ? canEdit(modal.task) : true}
          canDelete={modal.task ? canDelete(modal.task) : false}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
