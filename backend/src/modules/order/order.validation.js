import { body } from 'express-validator'
import { validate, idValidator } from '../../middlewares/validate.js'

export const createOrderValidator = [
  body('shippingAddress').exists().withMessage('shippingAddress is required').bail().isObject().withMessage('shippingAddress must be an object'),
  body('shippingAddress.details').exists({ values: 'falsy' }).withMessage('shippingAddress.details is required').bail().isString().trim(),
  body('shippingAddress.phone').exists({ values: 'falsy' }).withMessage('shippingAddress.phone is required').bail().matches(/^[0-9+\-\s]{7,16}$/).withMessage('invalid phone number'),
  body('shippingAddress.city').optional().isString().trim(),
  body('shippingAddress.postalCode').optional().isString().trim(),
  validate,
]
export const idParamValidator = idValidator()
