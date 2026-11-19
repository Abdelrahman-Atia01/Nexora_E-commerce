import { Router } from 'express'
import * as R from './review.controller.js'
import * as V from './review.validation.js'
import { protect, allowedTo } from '../../middlewares/auth.js'

const router = Router({ mergeParams: true })
router.route('/')
  .get(R.getReviews)
  .post(protect, allowedTo('user'), R.setProductInBody, V.createReviewValidator, R.createReview)
router.route('/:id')
  .get(V.idParamValidator, R.getReview)
  .patch(protect, allowedTo('user'), V.updateReviewValidator, R.updateReview)
  .delete(protect, V.idParamValidator, R.deleteReview)
export default router
