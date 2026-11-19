import { userModel } from '../DB/models/user.model.js'
import ApiError from '../utils/ApiError.js'
import { verifyToken } from '../utils/token.js'

// Requires a valid "Authorization: Bearer <token>" header.
export const protect = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next(new ApiError('You are not logged in, please login', 401))

  const decoded = verifyToken(header.split(' ')[1]) // JsonWebTokenError handled globally
  if (decoded.purpose) return next(new ApiError('Invalid token', 401))

  const user = await userModel.findById(decoded.id)
  if (!user) return next(new ApiError('The user belonging to this token no longer exists', 401))
  if (!user.active) return next(new ApiError('This account is deactivated', 403))
  if (user.passwordChangedAfter(decoded.iat))
    return next(new ApiError('Password was changed recently, please login again', 401))

  req.user = user
  next()
}

// Role based access: allowedTo('admin')
export const allowedTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new ApiError('You are not allowed to access this route', 403))
  next()
}
