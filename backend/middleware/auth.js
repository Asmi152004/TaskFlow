import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// Verifies the JWT sent as "Authorization: Bearer <token>" and attaches the user to req.user
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) throw new ApiError(401, 'Not authorized, please log in')

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    throw new ApiError(401, 'Your session has expired, please log in again')
  }

  const user = await User.findById(decoded.id)
  if (!user) throw new ApiError(401, 'This account no longer exists')

  req.user = user
  next()
})
