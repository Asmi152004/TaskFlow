import express from 'express'
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} from '../controllers/projectController.js'
import { protect } from '../middleware/auth.js'
import { loadProject, requireOwner } from '../middleware/projectAccess.js'

const router = express.Router()

// protect = must be logged in, loadProject = must be a member, requireOwner = must be the owner
router.route('/').get(protect, listProjects).post(protect, createProject)

router
  .route('/:projectId')
  .get(protect, loadProject, getProject)
  .put(protect, loadProject, requireOwner, updateProject)
  .delete(protect, loadProject, requireOwner, deleteProject)

router.post('/:projectId/members', protect, loadProject, requireOwner, addMember)
router.delete('/:projectId/members/:userId', protect, loadProject, requireOwner, removeMember)

export default router
