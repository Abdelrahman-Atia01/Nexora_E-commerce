import { Router } from 'express'
import * as B from './brand.controller.js'
import * as V from './brand.validation.js'
import { protect, allowedTo } from '../../middlewares/auth.js'
import { uploadSingleImage } from '../../middlewares/upload.js'

const router = Router()
router.route('/')
  .get(B.getBrands)
  .post(protect, allowedTo('admin'), uploadSingleImage('brands'), V.createBrandValidator, B.createBrand)
router.route('/:id')
  .get(V.idParamValidator, B.getBrand)
  .patch(protect, allowedTo('admin'), uploadSingleImage('brands'), V.updateBrandValidator, B.updateBrand)
  .delete(protect, allowedTo('admin'), V.idParamValidator, B.deleteBrand)
export default router
