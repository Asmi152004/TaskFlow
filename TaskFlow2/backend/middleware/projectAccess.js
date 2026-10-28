import Project from '../models/Project.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// Role-based access control, step 1: loads the project and checks the logged-in user is a member.
// Adds req.project and req.isOwner for the handlers that follow.
export const loadProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId)
  if (!project) throw new ApiError(404, 'Project not found')

  const userId = String(req.user._id)
  const isMember = project.members.some((m) => String(m) === userId)
  if (!isMember) throw new ApiError(403, 'You are not a member of this project')

  req.project = project
  req.isOwner = String(project.owner) === userId
  next()
})

// Role-based access control, step 2: only the project owner may continue
export const requireOwner = (req, res, next) => {
  if (!req.isOwner) return next(new ApiError(403, 'Only the project owner can do this'))
  next()
}
