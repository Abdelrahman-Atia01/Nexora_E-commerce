import { Router } from 'express'
import * as C from './cart.controller.js'
import * as V from './cart.validation.js'
import { protect, allowedTo } from '../../middlewares/auth.js'

const router = Router()
router.use(protect, allowedTo('user'))
router.route('/').get(C.getCart).post(V.addToCartValidator, C.addToCart).delete(C.clearCart)
router.patch('/apply-coupon', V.couponValidator, C.applyCoupon)
router.route('/:itemId').patch(V.updateQuantityValidator, C.updateItemQuantity).delete(V.itemIdValidator, C.removeItem)
export default router
