import { body } from 'express-validator'
import { validate, idValidator } from '../../middlewares/validate.js'

const future = (v) => new Date(v) > new Date()
export const createCouponValidator = [
  body('name').exists({ values: 'falsy' }).withMessage('coupon name is required').bail().isString().trim().isLength({ min: 3, max: 20 }).withMessage('coupon name must be 3-20 characters'),
  body('expire').exists({ values: 'falsy' }).withMessage('expire date is required').bail().isISO8601().withMessage('expire must be a valid date').bail().custom(future).withMessage('expire must be in the future'),
  body('discount').exists().withMessage('discount is required').bail().isFloat({ min: 1, max: 100 }).withMessage('discount must be between 1 and 100').toFloat(),
  validate,
]
export const updateCouponValidator = [
  ...idValidator(),
  body('name').optional().isString().trim().isLength({ min: 3, max: 20 }).withMessage('coupon name must be 3-20 characters'),
  body('expire').optional().isISO8601().withMessage('expire must be a valid date').bail().custom(future).withMessage('expire must be in the future'),
  body('discount').optional().isFloat({ min: 1, max: 100 }).withMessage('discount must be between 1 and 100').toFloat(),
  validate,
]
export const idParamValidator = idValidator()
