import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Project name is required'], trim: true, maxlength: 80 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // The owner is always included in members, which keeps membership checks simple
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

projectSchema.index({ members: 1 })

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema)
export default Project
