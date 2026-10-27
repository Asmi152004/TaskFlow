// Error with an HTTP status code, handled by the central error middleware.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}

export default ApiError
