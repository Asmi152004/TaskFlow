import mongoose from 'mongoose'

// Connects to MongoDB. If the connection fails the server keeps running and logs the reason,
// so the problem is easy to see in the hosting logs and on the /api/health endpoint.
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Add it to your environment variables.')
    return
  }

  mongoose.connection.on('connected', () => console.log('Database connected'))
  mongoose.connection.on('error', (err) => console.error('Database error:', err.message))
  mongoose.connection.on('disconnected', () => console.warn('Database disconnected'))

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'taskflow',
      serverSelectionTimeoutMS: 10000,
    })
  } catch (error) {
    // Common causes: Atlas cluster paused, IP not allowed in Atlas Network Access, wrong password.
    console.error('Database connection failed:', error.message)
  }
}

export default connectDB
