import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import { STATUSES, formatDate, getError, isOverdue, priorityStyles } from '../utils/helpers'

function StatCard({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch((error) => toast.error(getError(error)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Loading your dashboard..." />
  if (!data) return <p className="py-10 text-center text-slate-500">Could not load the dashboard. Please refresh the page.</p>

  const { stats, myTasks } = data
  const { statusCounts, priorityCounts } = stats
  const total = statusCounts.todo + statusCounts.in_progress + statusCounts.done
  const openTasks = statusCounts.todo + statusCounts.in_progress
  const percent = (n) => (total ? (n / total) * 100 : 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hello, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500">Here is what is happening across your projects.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Projects" value={stats.projects} />
        <StatCard label="Open tasks" value={openTasks} />
        <StatCard label="Overdue" value={stats.overdue} tone={stats.overdue ? 'text-red-600' : 'text-slate-900'} />
        <StatCard label="Completed" value={statusCounts.done} tone="text-emerald-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h2 className="font-semibold text-slate-900">Progress overview</h2>
          {total === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No tasks yet. Create a project and add your first task.</p>
          ) : (
            <>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="bg-emerald-500" style={{ width: `${percent(statusCounts.done)}%` }} />
                <div className="bg-amber-500" style={{ width: `${percent(statusCounts.in_progress)}%` }} />
                <div className="bg-slate-300" style={{ width: `${percent(statusCounts.todo)}%` }} />
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {STATUSES.map((s) => (
                  <li key={s.key} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    <span className="font-medium text-slate-900">{statusCounts[s.key]}</span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 text-sm font-semibold text-slate-900">Open tasks by priority</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {['high', 'medium', 'low'].map((p) => (
                  <li key={p} className="flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${priorityStyles[p]}`}>{p}</span>
                    <span className="font-medium text-slate-900">{priorityCounts[p]}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">My open tasks</h2>
            <span className="text-sm text-slate-500">{stats.myOpen} assigned to you</span>
          </div>

          {myTasks.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nothing assigned to you right now. Nice work!</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {myTasks.map((task) => (
                <li key={task._id}>
                  <Link to={`/projects/${task.project?._id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.project?.name}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs">
                      {task.dueDate && (
                        <span className={isOverdue(task) ? 'font-medium text-red-600' : 'text-slate-500'}>
                          {isOverdue(task) ? 'Overdue ' : 'Due '}
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${priorityStyles[task.priority]}`}>{task.priority}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
