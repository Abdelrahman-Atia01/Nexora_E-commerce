import { Router } from 'express'
import * as C from './category.controller.js'
import * as V from './category.validation.js'
import subCategoryRouter from '../subCategory/subCategory.router.js'
import { protect, allowedTo } from '../../middlewares/auth.js'
import { uploadSingleImage } from '../../middlewares/upload.js'

const router = Router()
router.use('/:categoryId/subcategories', subCategoryRouter) // GET/POST /categories/:categoryId/subcategories

router.route('/')
  .get(C.getCategories)
  .post(protect, allowedTo('admin'), uploadSingleImage('categories'), V.createCategoryValidator, C.createCategory)

router.route('/:id')
  .get(V.idParamValidator, C.getCategory)
  .patch(protect, allowedTo('admin'), uploadSingleImage('categories'), V.updateCategoryValidator, C.updateCategory)
  .delete(protect, allowedTo('admin'), V.idParamValidator, C.deleteCategory)

export default router
