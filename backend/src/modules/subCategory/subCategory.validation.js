import { body } from 'express-validator'
import { validate, idValidator } from '../../middlewares/validate.js'
import { categoryModel } from '../../DB/models/category.model.js'

const name = (optional) => {
  const c = body('name')
  return (optional ? c.optional() : c.exists({ values: 'falsy' }).withMessage('subCategory name is required').bail())
    .isString().trim().isLength({ min: 2, max: 32 }).withMessage('subCategory name must be 2-32 characters')
}
const categoryExists = (optional) => {
  const c = body('category')
  return (optional ? c.optional() : c.exists({ values: 'falsy' }).withMessage('category id is required').bail())
    .isMongoId().withMessage('invalid category id format')
    .bail()
    .custom(async (id) => {
      if (!(await categoryModel.exists({ _id: id }))) throw new Error(`no category found for id ${id}`)
    })
}
// supports nested route: POST /categories/:categoryId/subcategories
export const setCategoryInBody = (req, res, next) => {
  if (!req.body.category && req.params.categoryId) req.body.category = req.params.categoryId
  next()
}
export const createSubCategoryValidator = [name(false), categoryExists(false), validate]
export const updateSubCategoryValidator = [...idValidator(), name(true), categoryExists(true), validate]
export const idParamValidator = idValidator()
