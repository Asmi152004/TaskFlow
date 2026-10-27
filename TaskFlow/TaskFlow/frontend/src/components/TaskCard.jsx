import Avatar from './Avatar'
import { STATUSES, formatDate, isOverdue, priorityStyles } from '../utils/helpers'

export default function TaskCard({ task, canEdit, onOpen, onStatusChange }) {
  const overdue = isOverdue(task)

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task._id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={() => onOpen(task)}
      className={`card cursor-pointer p-3 transition hover:border-indigo-300 hover:shadow ${canEdit ? 'active:cursor-grabbing' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-900">{task.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {task.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {task.dueDate && (
            <span className={overdue ? 'font-medium text-red-600' : ''}>
              {overdue ? 'Overdue: ' : 'Due '}
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.comments?.length > 0 && <span>{task.comments.length} comment{task.comments.length > 1 ? 's' : ''}</span>}
        </div>
        {task.assignee ? <Avatar name={task.assignee.name} size="sm" title={`Assigned to ${task.assignee.name}`} /> : (
          <span className="text-xs text-slate-400">Unassigned</span>
        )}
      </div>

      {canEdit && (
        // Dropdown alternative to drag and drop (works on phones and with the keyboard)
        <select
          value={task.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          aria-label="Change status"
          className="mt-3 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      )}
    </div>
  )
}
