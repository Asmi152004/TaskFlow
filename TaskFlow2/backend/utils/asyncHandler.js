// Wraps an async route handler so any thrown error is passed to Express's error middleware.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export default asyncHandler
