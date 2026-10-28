import Project from '../models/Project.js'
import Task from '../models/Task.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

const populateTask = (task) =>
  task.populate([
    { path: 'assignee', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
    { path: 'comments.user', select: 'name' },
  ])

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// An assignee must be a member of the same project
const assertAssigneeInProject = (project, assignee) => {
  if (!assignee) return
  const isMember = project.members.some((m) => String(m) === String(assignee))
  if (!isMember) throw new ApiError(400, 'The assignee must be a member of this project')
}

// Loads a task and works out what the logged-in user is allowed to do with it:
//   owner            -> edit and delete any task
//   task creator     -> edit and delete their own task
//   task assignee    -> edit the task assigned to them
//   other members    -> view and comment only
const loadTaskWithAccess = async (req) => {
  const task = await Task.findById(req.params.id)
  if (!task) throw new ApiError(404, 'Task not found')

  const project = await Project.findById(task.project)
  if (!project) throw new ApiError(404, 'Project not found')

  const userId = String(req.user._id)
  if (!project.members.some((m) => String(m) === userId)) {
    throw new ApiError(403, 'You are not a member of this project')
  }

  const isOwner = String(project.owner) === userId
  const isCreator = String(task.createdBy) === userId
  const isAssignee = task.assignee ? String(task.assignee) === userId : false

  return {
    task,
    project,
    canEdit: isOwner || isCreator || isAssignee,
    canDelete: isOwner || isCreator,
  }
}

// GET /api/projects/:projectId/tasks?status=&priority=&assignee=&search=&page=&limit=&sort=
export const listTasks = asyncHandler(async (req, res) => {
  const { status, priority, assignee, search } = req.query
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200)

  const filter = { project: req.project._id }
  if (status) filter.status = status
  if (priority) filter.priority = priority
  if (assignee === 'me') filter.assignee = req.user._id
  else if (assignee === 'unassigned') filter.assignee = null
  else if (assignee) filter.assignee = assignee
  if (search) filter.title = { $regex: escapeRegex(String(search)), $options: 'i' }

  const allowedSorts = ['createdAt', '-createdAt', 'dueDate', '-dueDate', 'updatedAt', '-updatedAt']
  const sort = allowedSorts.includes(req.query.sort) ? req.query.sort : '-createdAt'

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name'),
    Task.countDocuments(filter),
  ])

  res.json({ success: true, tasks, total, page, pages: Math.ceil(total / limit) || 1 })
})

// POST /api/projects/:projectId/tasks
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, assignee } = req.body

  if (!title || !String(title).trim()) throw new ApiError(400, 'Task title is required')
  assertAssigneeInProject(req.project, assignee)

  const task = await Task.create({
    project: req.project._id,
    title,
    description,
    status,
    priority,
    dueDate: dueDate || null,
    assignee: assignee || null,
    createdBy: req.user._id,
  })

  await populateTask(task)
  res.status(201).json({ success: true, task })
})

// PUT /api/tasks/:id
export const updateTask = asyncHandler(async (req, res) => {
  const { task, project, canEdit } = await loadTaskWithAccess(req)
  if (!canEdit) throw new ApiError(403, 'You can only edit tasks you created or that are assigned to you')

  const { title, description, status, priority, dueDate } = req.body

  if (title !== undefined) {
    if (!String(title).trim()) throw new ApiError(400, 'Task title cannot be empty')
    task.title = title
  }
  if (description !== undefined) task.description = description
  if (status !== undefined) task.status = status
  if (priority !== undefined) task.priority = priority
  if (dueDate !== undefined) task.dueDate = dueDate || null

  if (req.body.assignee !== undefined) {
    assertAssigneeInProject(project, req.body.assignee)
    task.assignee = req.body.assignee || null
  }

  await task.save()
  await populateTask(task)
  res.json({ success: true, task })
})

// DELETE /api/tasks/:id
export const deleteTask = asyncHandler(async (req, res) => {
  const { task, canDelete } = await loadTaskWithAccess(req)
  if (!canDelete) throw new ApiError(403, 'Only the project owner or the task creator can delete this task')

  await task.deleteOne()
  res.json({ success: true, message: 'Task deleted' })
})

// POST /api/tasks/:id/comments  - any project member can comment
export const addComment = asyncHandler(async (req, res) => {
  const { task } = await loadTaskWithAccess(req)
  const text = String(req.body.text || '').trim()
  if (!text) throw new ApiError(400, 'Comment cannot be empty')

  task.comments.push({ user: req.user._id, text })
  await task.save()
  await populateTask(task)

  res.status(201).json({ success: true, task })
})
