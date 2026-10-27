// Creates demo users, projects and tasks so a fresh deployment is not empty.
// Run once with:  npm run seed   (uses the MONGODB_URI from your .env file)
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'
import Project from './models/Project.js'
import Task from './models/Task.js'

const DEMO_PASSWORD = 'Demo@1234'
const inDays = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000)

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Create backend/.env first.')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'taskflow' })

  if (await User.findOne({ email: 'demo@taskflow.com' })) {
    console.log('Demo data already exists. Nothing to do.')
    await mongoose.disconnect()
    return
  }

  const password = await bcrypt.hash(DEMO_PASSWORD, 10)
  const [demo, riya, arjun] = await User.create([
    { name: 'Demo User', email: 'demo@taskflow.com', password },
    { name: 'Riya Sharma', email: 'riya@taskflow.com', password },
    { name: 'Arjun Mehta', email: 'arjun@taskflow.com', password },
  ])

  const website = await Project.create({
    name: 'Website Redesign',
    description: 'Refresh the company website: new design, faster pages and better accessibility.',
    owner: demo._id,
    members: [demo._id, riya._id, arjun._id],
  })

  const mobile = await Project.create({
    name: 'Mobile App Launch',
    description: 'Plan and ship version 1.0 of the mobile app.',
    owner: riya._id,
    members: [riya._id, demo._id],
  })

  await Task.create([
    { project: website._id, title: 'Collect brand assets', description: 'Logos, fonts and colour palette from the design team.', status: 'done', priority: 'low', dueDate: inDays(-6), assignee: riya._id, createdBy: demo._id },
    { project: website._id, title: 'Design homepage wireframes', description: 'Low-fidelity layouts for desktop and mobile.', status: 'done', priority: 'high', dueDate: inDays(-3), assignee: demo._id, createdBy: demo._id,
      comments: [{ user: riya._id, text: 'Wireframes look great, approved for the next stage.' }] },
    { project: website._id, title: 'Build responsive navigation bar', description: 'Sticky navbar with a mobile menu.', status: 'in_progress', priority: 'high', dueDate: inDays(2), assignee: demo._id, createdBy: demo._id },
    { project: website._id, title: 'Optimise images and lazy loading', description: 'Compress hero images and lazy-load below the fold.', status: 'in_progress', priority: 'medium', dueDate: inDays(5), assignee: arjun._id, createdBy: demo._id,
      comments: [{ user: arjun._id, text: 'Converted the hero images to WebP, page weight is down noticeably.' }, { user: demo._id, text: 'Nice. Please check the Lighthouse score once more.' }] },
    { project: website._id, title: 'Fix contact form validation', description: 'Show clear error messages and prevent duplicate submissions.', status: 'todo', priority: 'high', dueDate: inDays(-1), assignee: demo._id, createdBy: riya._id },
    { project: website._id, title: 'Write accessibility checklist', description: '', status: 'todo', priority: 'medium', dueDate: inDays(9), assignee: null, createdBy: demo._id },
    { project: website._id, title: 'Set up analytics dashboard', description: 'Track page views and sign-up conversions.', status: 'todo', priority: 'low', dueDate: null, assignee: riya._id, createdBy: demo._id },
    { project: mobile._id, title: 'Finalise feature list for v1.0', description: 'Agree what is in and out of scope.', status: 'done', priority: 'high', dueDate: inDays(-4), assignee: riya._id, createdBy: riya._id },
    { project: mobile._id, title: 'Create onboarding screens', description: 'Three-step welcome flow.', status: 'in_progress', priority: 'medium', dueDate: inDays(4), assignee: demo._id, createdBy: riya._id },
    { project: mobile._id, title: 'Prepare app store listing', description: 'Screenshots, description and keywords.', status: 'todo', priority: 'medium', dueDate: inDays(12), assignee: riya._id, createdBy: riya._id },
    { project: mobile._id, title: 'Run beta test with 10 users', description: '', status: 'todo', priority: 'high', dueDate: inDays(15), assignee: null, createdBy: riya._id },
  ])

  console.log('Demo data created.')
  console.log('Log in with  demo@taskflow.com  /  ' + DEMO_PASSWORD)
  await mongoose.disconnect()
}

run().catch((error) => {
  console.error('Seeding failed:', error.message)
  process.exit(1)
})
