export const STATUSES = [
  { key: 'todo', label: 'To Do', dot: 'bg-slate-400' },
  { key: 'in_progress', label: 'In Progress', dot: 'bg-amber-500' },
  { key: 'done', label: 'Done', dot: 'bg-emerald-500' },
]

export const PRIORITIES = ['low', 'medium', 'high']

export const priorityStyles = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

export const statusLabel = (key) => STATUSES.find((s) => s.key === key)?.label || key

// Turns an API/network error into a message that is safe to show the user
export const getError = (error) => {
  if (error.response?.data?.message) return error.response.data.message
  if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
    return 'Cannot reach the server. It may be waking up, please try again in a minute.'
  }
  return error.message || 'Something went wrong'
}

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

// A task is overdue when it has a due date before today and is not finished
export const isOverdue = (task) =>
  Boolean(task.dueDate) && task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().toDateString())

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || '?'
