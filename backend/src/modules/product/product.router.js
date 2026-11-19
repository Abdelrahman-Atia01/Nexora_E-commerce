import { Router } from 'express'
import * as P from './product.controller.js'
import * as V from './product.validation.js'
import { protect, allowedTo } from '../../middlewares/auth.js'
import { uploadProductImages } from '../../middlewares/upload.js'
import reviewRouter from '../review/review.router.js'

const router = Router()
router.use('/:productId/reviews', reviewRouter) // GET/POST /products/:productId/reviews

router.route('/')
  .get(P.getProducts)
  .post(protect, allowedTo('admin'), uploadProductImages, V.createProductValidator, P.createProduct)
router.route('/:id')
  .get(V.idParamValidator, P.getProduct)
  .patch(protect, allowedTo('admin'), uploadProductImages, V.updateProductValidator, P.updateProduct)
  .delete(protect, allowedTo('admin'), V.idParamValidator, P.deleteProduct)
export default router
