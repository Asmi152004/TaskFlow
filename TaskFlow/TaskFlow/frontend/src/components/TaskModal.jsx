import { useState } from 'react'
import { toast } from 'react-toastify'
import api from '../api'
import Modal from './Modal'
import Avatar from './Avatar'
import { PRIORITIES, STATUSES, getError } from '../utils/helpers'

// Used for both creating a new task (task = null) and viewing / editing an existing one
export default function TaskModal({ projectId, members, task, defaultStatus = 'todo', canEdit, canDelete, onClose, onSaved, onDeleted }) {
  const isNew = !task
  const [current, setCurrent] = useState(task)
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || defaultStatus,
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    assignee: task?.assignee?._id || '',
  })
  const [saving, setSaving] = useState(false)
  const [comment, setComment] = useState('')

  const readOnly = !isNew && !canEdit
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Please enter a task title')

    setSaving(true)
    const payload = {
      ...form,
      title: form.title.trim(),
      dueDate: form.dueDate || null,
      assignee: form.assignee || null,
    }

    try {
      const { data } = isNew
        ? await api.post(`/projects/${projectId}/tasks`, payload)
        : await api.put(`/tasks/${current._id}`, payload)
      toast.success(isNew ? 'Task created' : 'Task updated')
      onSaved(data.task)
      onClose()
    } catch (error) {
      toast.error(getError(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return
    try {
      await api.delete(`/tasks/${current._id}`)
      toast.success('Task deleted')
      onDeleted(current._id)
      onClose()
    } catch (error) {
      toast.error(getError(error))
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    try {
      const { data } = await api.post(`/tasks/${current._id}/comments`, { text: comment })
      setCurrent(data.task)
      onSaved(data.task)
      setComment('')
    } catch (error) {
      toast.error(getError(error))
    }
  }

  return (
    <Modal title={isNew ? 'New task' : readOnly ? 'Task details' : 'Edit task'} onClose={onClose} wide>
      {readOnly && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You can view this task and comment on it. Only the project owner, the task creator or the assignee can edit it.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" className="input" value={form.title} onChange={setField('title')} disabled={readOnly} maxLength={120} placeholder="What needs to be done?" autoFocus={isNew} />
        </div>

        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" rows={3} className="input" value={form.description} onChange={setField('description')} disabled={readOnly} maxLength={1000} placeholder="Add more detail (optional)" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" className="input" value={form.status} onChange={setField('status')} disabled={readOnly}>
              {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="priority">Priority</label>
            <select id="priority" className="input capitalize" value={form.priority} onChange={setField('priority')} disabled={readOnly}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dueDate">Due date</label>
            <input id="dueDate" type="date" className="input" value={form.dueDate} onChange={setField('dueDate')} disabled={readOnly} />
          </div>
          <div>
            <label className="label" htmlFor="assignee">Assignee</label>
            <select id="assignee" className="input" value={form.assignee} onChange={setField('assignee')} disabled={readOnly}>
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {!isNew && canDelete && (
              <button type="button" onClick={handleDelete} className="btn-danger">Delete</button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">{readOnly ? 'Close' : 'Cancel'}</button>
            {!readOnly && (
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : isNew ? 'Create task' : 'Save changes'}
              </button>
            )}
          </div>
        </div>
      </form>

      {!isNew && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Comments ({current.comments?.length || 0})</h3>

          <div className="space-y-3">
            {current.comments?.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
            {current.comments?.map((c) => (
              <div key={c._id} className="flex gap-3">
                <Avatar name={c.user?.name} size="sm" />
                <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{c.user?.name || 'Unknown'}</span>
                    {' · '}
                    {new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-0.5 break-words text-sm text-slate-800">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleComment} className="mt-3 flex gap-2">
            <input className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment..." maxLength={500} />
            <button type="submit" className="btn-primary" disabled={!comment.trim()}>Post</button>
          </form>
        </div>
      )}
    </Modal>
  )
}
