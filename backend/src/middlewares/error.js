import ApiError from '../utils/ApiError.js'
import { config } from '../config/index.js'

export const notFound = (req, res, next) => next(new ApiError(`Can't find this route: ${req.method} ${req.originalUrl}`, 404))

// Converts known library errors into clean ApiErrors.
const normalize = (err) => {
  if (err.isOperational) return err
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
    return new ApiError(errors[0].message, 400, errors)
  }
  if (err.name === 'CastError') return new ApiError(`Invalid ${err.path}: ${err.value}`, 400)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    return new ApiError(`Duplicate value for "${field}", it must be unique`, 409)
  }
  if (err.name === 'JsonWebTokenError') return new ApiError('Invalid token, please login again', 401)
  if (err.name === 'TokenExpiredError') return new ApiError('Token expired, please login again', 401)
  if (err.name === 'MulterError')
    return new ApiError(err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5MB)' : err.message, 400)
  if (err.type === 'entity.parse.failed') return new ApiError('Invalid JSON body', 400)
  if (err.type === 'entity.too.large') return new ApiError('Request body too large', 413)
  return err
}

// eslint-disable-next-line no-unused-vars
export const globalError = (err, req, res, next) => {
  const e = normalize(err)
  const statusCode = e.statusCode || 500
  const operational = e.isOperational === true
  if (!operational) console.error('UNEXPECTED ERROR:', err)

  const body = {
    status: statusCode >= 500 ? 'error' : 'fail',
    message: operational || !config.isProd ? e.message : 'Something went wrong',
  }
  if (e.errors) body.errors = e.errors
  if (!config.isProd) body.stack = err.stack
  res.status(statusCode).json(body)
}
