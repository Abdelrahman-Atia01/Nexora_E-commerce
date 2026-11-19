// Operational (predictable) errors: wrong input, not found, unauthorized...
export default class ApiError extends Error {
  constructor(message, statusCode = 500, errors) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true
    if (errors) this.errors = errors
    Error.captureStackTrace?.(this, this.constructor)
  }
}
