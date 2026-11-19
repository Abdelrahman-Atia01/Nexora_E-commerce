import { body } from 'express-validator'
import { validate, idValidator } from '../../middlewares/validate.js'

const name = (optional) => {
  const c = body('name')
  return (optional ? c.optional() : c.exists({ values: 'falsy' }).withMessage('brand name is required').bail())
    .isString().trim().isLength({ min: 2, max: 35 }).withMessage('brand name must be 2-35 characters')
}
export const createBrandValidator = [name(false), validate]
export const updateBrandValidator = [...idValidator(), name(true), validate]
export const idParamValidator = idValidator()
