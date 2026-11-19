import { Router } from 'express'
import { couponModel } from '../../DB/models/coupon.model.js'
import * as factory from '../../utils/handlerFactory.js'
import { protect, allowedTo } from '../../middlewares/auth.js'
import * as V from './coupon.validation.js'

const FIELDS = ['name', 'expire', 'discount']
const router = Router()
router.use(protect, allowedTo('admin'))
router.route('/').get(factory.getAll(couponModel, ['name'])).post(V.createCouponValidator, factory.createOne(couponModel, FIELDS))
router.route('/:id')
  .get(V.idParamValidator, factory.getOne(couponModel))
  .patch(V.updateCouponValidator, factory.updateOne(couponModel, FIELDS))
  .delete(V.idParamValidator, factory.deleteOne(couponModel))
export default router
