import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import validator from 'validator'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

// Shape of the user object sent to the frontend (never includes the password)
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email })

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')

  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required')
  if (!validator.isEmail(email)) throw new ApiError(400, 'Please enter a valid email address')
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters long')

  const exists = await User.findOne({ email })
  if (exists) throw new ApiError(409, 'An account with this email already exists')

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, password: hashedPassword })

  res.status(201).json({ success: true, token: signToken(user._id), user: publicUser(user) })
})

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')

  if (!email || !password) throw new ApiError(400, 'Email and password are required')

  // The password field is hidden by default, so it has to be requested explicitly here
  const user = await User.findOne({ email }).select('+password')
  const isMatch = user ? await bcrypt.compare(password, user.password) : false

  // Same message for "no such user" and "wrong password" so accounts cannot be guessed
  if (!isMatch) throw new ApiError(401, 'Invalid email or password')

  res.json({ success: true, token: signToken(user._id), user: publicUser(user) })
})

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) })
})
