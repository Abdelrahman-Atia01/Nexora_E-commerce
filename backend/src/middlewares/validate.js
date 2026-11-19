import { validationResult } from 'express-validator'
import ApiError from '../utils/ApiError.js'

// Place at the end of an express-validator chain array.
export const validate = (req, res, next) => {
  const result = validationResult(req)
  if (result.isEmpty()) return next()
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }))
  next(new ApiError(errors[0].message, 400, errors))
}

import { param } from 'express-validator'
export const idValidator = (name = 'id') => [param(name).isMongoId().withMessage(`Invalid ${name} format`), validate]
