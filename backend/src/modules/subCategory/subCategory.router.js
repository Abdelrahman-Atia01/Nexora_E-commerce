import { Router } from 'express'
import * as S from './subCategory.controller.js'
import * as V from './subCategory.validation.js'
import { protect, allowedTo } from '../../middlewares/auth.js'

const router = Router({ mergeParams: true }) // read :categoryId from the parent router
router.route('/')
  .get(S.getSubCategories)
  .post(protect, allowedTo('admin'), V.setCategoryInBody, V.createSubCategoryValidator, S.createSubCategory)
router.route('/:id')
  .get(V.idParamValidator, S.getSubCategory)
  .patch(protect, allowedTo('admin'), V.updateSubCategoryValidator, S.updateSubCategory)
  .delete(protect, allowedTo('admin'), V.idParamValidator, S.deleteSubCategory)
export default router
