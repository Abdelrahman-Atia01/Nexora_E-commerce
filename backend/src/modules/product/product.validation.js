import { body } from 'express-validator'
import { validate, idValidator } from '../../middlewares/validate.js'
import { categoryModel } from '../../DB/models/category.model.js'
import { brandModel } from '../../DB/models/brand.model.js'
import { subCategoryModel } from '../../DB/models/subCategory.model.js'
import { productModel } from '../../DB/models/product.model.js'

// multipart/form-data sends arrays as a string or repeated fields -> normalize to array
const toArray = (v) => {
  if (v === undefined || v === null || v === '') return undefined
  if (Array.isArray(v)) return v
  if (typeof v === 'string' && v.trim().startsWith('[')) {
    try { return JSON.parse(v) } catch { return [v] }
  }
  return String(v).split(',').map((s) => s.trim()).filter(Boolean)
}

const rules = (create) => {
  const f = (name, msg) => {
    const c = body(name)
    return create ? c.exists({ values: 'null' }).withMessage(msg).bail() : c.optional()
  }
  return [
    f('title', 'product title is required').isString().trim().isLength({ min: 3, max: 100 }).withMessage('title must be 3-100 characters'),
    f('description', 'product description is required').isString().trim().isLength({ min: 20, max: 2000 }).withMessage('description must be 20-2000 characters'),
    f('quantity', 'product quantity is required').isInt({ min: 0 }).withMessage('quantity must be a non-negative integer').toInt(),
    f('price', 'product price is required').isFloat({ min: 0, max: 99999999 }).withMessage('price must be a positive number').toFloat(),
    body('sold').optional().isInt({ min: 0 }).withMessage('sold must be a non-negative integer').toInt(),
    body('priceAfterDiscount').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('priceAfterDiscount must be a number').toFloat()
      .custom(async (value, { req }) => {
        let price = req.body.price
        if (price === undefined && req.params.id) price = (await productModel.findById(req.params.id).select('price'))?.price
        if (price !== undefined && value >= price) throw new Error('priceAfterDiscount must be lower than price')
        return true
      }),
    body('colors').optional().customSanitizer(toArray).isArray().withMessage('colors must be an array of strings'),
    f('imageCover', 'product imageCover is required').isString(),
    body('images').optional().customSanitizer(toArray).isArray({ max: 5 }).withMessage('images must be an array (max 5)'),
    f('category', 'product must belong to a category').isMongoId().withMessage('invalid category id').bail()
      .custom(async (id) => {
        if (!(await categoryModel.exists({ _id: id }))) throw new Error(`no category found for id ${id}`)
      }),
    body('subcategories').optional().customSanitizer(toArray).isArray().withMessage('subcategories must be an array of ids')
      .bail()
      .custom((arr) => arr.every((id) => /^[a-f\d]{24}$/i.test(id)) || Promise.reject(new Error('invalid subCategory id format')))
      .bail()
      .custom(async (ids, { req }) => {
        if (!ids.length) return true
        let category = req.body.category
        if (!category && req.params.id) category = (await productModel.findById(req.params.id).select('category'))?.category
        const found = await subCategoryModel.find({ _id: { $in: ids }, ...(category ? { category } : {}) }).select('_id')
        if (found.length !== new Set(ids).size) throw new Error('some subcategories do not exist or do not belong to the product category')
        return true
      }),
    body('brand').optional().isMongoId().withMessage('invalid brand id').bail()
      .custom(async (id) => {
        if (!(await brandModel.exists({ _id: id }))) throw new Error(`no brand found for id ${id}`)
      }),
    validate,
  ]
}

export const createProductValidator = rules(true)
export const updateProductValidator = [...idValidator(), ...rules(false)]
export const idParamValidator = idValidator()
