import { body } from 'express-validator'
import { validate, idValidator } from '../../middlewares/validate.js'
import { productModel } from '../../DB/models/product.model.js'

export const createReviewValidator = [
  body('rating').exists().withMessage('rating is required').bail().isFloat({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5').toFloat(),
  body('comment').optional().isString().isLength({ max: 1000 }).withMessage('comment is too long'),
  body('product').exists().withMessage('product id is required').bail().isMongoId().withMessage('invalid product id').bail()
    .custom(async (id) => {
      if (!(await productModel.exists({ _id: id }))) throw new Error(`no product found for id ${id}`)
    }),
  validate,
]
export const updateReviewValidator = [
  ...idValidator(),
  body('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5').toFloat(),
  body('comment').optional().isString().isLength({ max: 1000 }).withMessage('comment is too long'),
  validate,
]
export const idParamValidator = idValidator()
