import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import { notFound, errorHandler } from './middleware/error.js'

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to your environment variables and restart.')
  process.exit(1)
}

const app = express()
const port = process.env.PORT || 5000

// CORS: only the frontend URL(s) listed in CLIENT_URL may call the API (all origins if it is empty)
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      callback(null, false)
    },
  })
)
app.use(express.json({ limit: '1mb' }))

// Health checks (useful for hosting platforms and for debugging)
app.get('/', (req, res) => res.send('TaskFlow API is running'))
app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
  const database = states[mongoose.connection.readyState] || 'unknown'
  res.status(database === 'connected' ? 200 : 503).json({ server: 'ok', database })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api', taskRoutes)

app.use(notFound)
app.use(errorHandler)

// Keep the process alive and log the reason if something unexpected happens
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason))

connectDB()
app.listen(port, () => console.log(`TaskFlow API listening on port ${port}`))
