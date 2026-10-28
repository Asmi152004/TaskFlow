import Project from '../models/Project.js'
import Task from '../models/Task.js'
import asyncHandler from '../utils/asyncHandler.js'

// GET /api/dashboard - summary numbers across every project the user belongs to
export const getDashboard = asyncHandler(async (req, res) => {
  const projects = await Project.find({ members: req.user._id }).select('_id')
  const projectIds = projects.map((p) => p._id)

  const inMyProjects = { project: { $in: projectIds } }
  const open = { status: { $ne: 'done' } }

  const [byStatus, byPriority, overdue, myOpen, myTasks] = await Promise.all([
    Task.aggregate([{ $match: inMyProjects }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.aggregate([
      { $match: { ...inMyProjects, ...open } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({ ...inMyProjects, ...open, dueDate: { $lt: new Date() } }),
    Task.countDocuments({ ...inMyProjects, ...open, assignee: req.user._id }),
    Task.find({ ...inMyProjects, ...open, assignee: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('project', 'name')
      .lean(),
  ])

  const statusCounts = { todo: 0, in_progress: 0, done: 0 }
  byStatus.forEach((s) => { statusCounts[s._id] = s.count })

  const priorityCounts = { low: 0, medium: 0, high: 0 }
  byPriority.forEach((p) => { priorityCounts[p._id] = p.count })

  // Tasks with the earliest due date first; tasks without a due date go last
  const upcoming = myTasks
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate) - new Date(b.dueDate)
    })
    .slice(0, 6)

  res.json({
    success: true,
    stats: {
      projects: projectIds.length,
      statusCounts,
      priorityCounts,
      overdue,
      myOpen,
    },
    myTasks: upcoming,
  })
})
