import express from 'express'
import { listTasks, createTask, updateTask, deleteTask, addComment } from '../controllers/taskController.js'
import { protect } from '../middleware/auth.js'
import { loadProject } from '../middleware/projectAccess.js'

// Mounted at /api, so these become /api/projects/:projectId/tasks and /api/tasks/:id
const router = express.Router()

router
  .route('/projects/:projectId/tasks')
  .get(protect, loadProject, listTasks)
  .post(protect, loadProject, createTask)

router.route('/tasks/:id').put(protect, updateTask).delete(protect, deleteTask)
router.post('/tasks/:id/comments', protect, addComment)

export default router
