import { body } from 'express-validator'
import { validate, idValidator } from '../../middlewares/validate.js'

export const addToCartValidator = [
  body('productId').exists().withMessage('productId is required').bail().isMongoId().withMessage('invalid product id'),
  body('quantity').optional().isInt({ min: 1, max: 100 }).withMessage('quantity must be between 1 and 100').toInt(),
  body('color').optional().isString().trim(),
  validate,
]
export const updateQuantityValidator = [
  ...idValidator('itemId'),
  body('quantity').exists().withMessage('quantity is required').bail().isInt({ min: 1, max: 100 }).withMessage('quantity must be between 1 and 100').toInt(),
  validate,
]
export const itemIdValidator = idValidator('itemId')
export const couponValidator = [
  body('coupon').exists({ values: 'falsy' }).withMessage('coupon is required').bail().isString().trim(),
  validate,
]
