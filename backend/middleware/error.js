import ApiError from '../utils/ApiError.js'

// 404 for any route that does not exist
export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

// Central error handler: every error ends up here and is returned as { success: false, message }
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500
  let message = err.message || 'Server error'

  if (err.name === 'ValidationError') {
    status = 400
    message = Object.values(err.errors).map((e) => e.message).join(', ')
  } else if (err.name === 'CastError') {
    status = 400
    message = `Invalid value for ${err.path}`
  } else if (err.code === 11000) {
    status = 409
    const field = Object.keys(err.keyValue || {})[0] || 'value'
    message = `This ${field} is already registered`
  }

  if (status === 500) console.error(err)

  res.status(status).json({ success: false, message: status === 500 ? 'Something went wrong on the server' : message })
}
