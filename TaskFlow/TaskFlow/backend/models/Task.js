import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: [true, 'Comment cannot be empty'], trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: [true, 'Task title is required'], trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: { values: ['todo', 'in_progress', 'done'], message: 'Status must be todo, in_progress or done' },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: { values: ['low', 'medium', 'high'], message: 'Priority must be low, medium or high' },
      default: 'medium',
    },
    dueDate: { type: Date, default: null },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [commentSchema],
  },
  { timestamps: true }
)

// Speeds up the most common queries: tasks of a project, filtered by status
taskSchema.index({ project: 1, status: 1 })
taskSchema.index({ assignee: 1 })

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema)
export default Task
