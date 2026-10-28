import validator from 'validator'
import Project from '../models/Project.js'
import Task from '../models/Task.js'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

const populateProject = (project) =>
  project.populate([
    { path: 'owner', select: 'name email' },
    { path: 'members', select: 'name email' },
  ])

// GET /api/projects - all projects the user belongs to, with task counts for progress bars
export const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ members: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('owner', 'name email')
    .lean()

  const ids = projects.map((p) => p._id)
  const stats = await Task.aggregate([
    { $match: { project: { $in: ids } } },
    { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } },
  ])

  const countsByProject = {}
  stats.forEach((s) => {
    const key = String(s._id.project)
    countsByProject[key] = countsByProject[key] || { todo: 0, in_progress: 0, done: 0 }
    countsByProject[key][s._id.status] = s.count
  })

  const result = projects.map((p) => {
    const counts = countsByProject[String(p._id)] || { todo: 0, in_progress: 0, done: 0 }
    return {
      ...p,
      memberCount: p.members.length,
      counts,
      totalTasks: counts.todo + counts.in_progress + counts.done,
    }
  })

  res.json({ success: true, projects: result })
})

// POST /api/projects
export const createProject = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim()
  const description = String(req.body.description || '').trim()
  if (!name) throw new ApiError(400, 'Project name is required')

  const project = await Project.create({
    name,
    description,
    owner: req.user._id,
    members: [req.user._id],
  })

  res.status(201).json({ success: true, project })
})

// GET /api/projects/:projectId
export const getProject = asyncHandler(async (req, res) => {
  await populateProject(req.project)
  res.json({ success: true, project: req.project, isOwner: req.isOwner })
})

// PUT /api/projects/:projectId  (owner only)
export const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body

  if (name !== undefined) {
    if (!String(name).trim()) throw new ApiError(400, 'Project name cannot be empty')
    req.project.name = name
  }
  if (description !== undefined) req.project.description = description

  await req.project.save()
  await populateProject(req.project)
  res.json({ success: true, project: req.project })
})

// DELETE /api/projects/:projectId  (owner only) - also removes the project's tasks
export const deleteProject = asyncHandler(async (req, res) => {
  await Task.deleteMany({ project: req.project._id })
  await req.project.deleteOne()
  res.json({ success: true, message: 'Project deleted' })
})

// POST /api/projects/:projectId/members  (owner only) - add a registered user by email
export const addMember = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  if (!validator.isEmail(email)) throw new ApiError(400, 'Please enter a valid email address')

  const user = await User.findOne({ email })
  if (!user) throw new ApiError(404, 'No user found with that email. Ask them to register first.')

  const alreadyMember = req.project.members.some((m) => String(m) === String(user._id))
  if (alreadyMember) throw new ApiError(409, 'This user is already a member')

  req.project.members.push(user._id)
  await req.project.save()
  await populateProject(req.project)

  res.json({ success: true, project: req.project })
})

// DELETE /api/projects/:projectId/members/:userId  (owner only)
export const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params

  if (String(req.project.owner) === String(userId)) {
    throw new ApiError(400, 'The project owner cannot be removed')
  }

  req.project.members = req.project.members.filter((m) => String(m) !== String(userId))
  await req.project.save()

  // Tasks assigned to the removed member become unassigned
  await Task.updateMany({ project: req.project._id, assignee: userId }, { assignee: null })

  await populateProject(req.project)
  res.json({ success: true, project: req.project })
})
