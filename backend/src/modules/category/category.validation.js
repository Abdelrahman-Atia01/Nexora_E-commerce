import { body } from 'express-validator'
import { validate, idValidator } from '../../middlewares/validate.js'

const name = (optional) => {
  const c = body('name')
  return (optional ? c.optional() : c.exists({ values: 'falsy' }).withMessage('category name is required').bail())
    .isString().trim().isLength({ min: 3, max: 35 }).withMessage('category name must be 3-35 characters')
}
export const createCategoryValidator = [name(false), validate]
export const updateCategoryValidator = [...idValidator(), name(true), validate]
export const idParamValidator = idValidator()
