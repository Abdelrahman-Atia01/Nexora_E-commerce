import { Router } from 'express'
import * as O from './order.controller.js'
import * as V from './order.validation.js'
import { protect, allowedTo } from '../../middlewares/auth.js'

const router = Router()
router.use(protect)
router.route('/').get(O.getOrders).post(allowedTo('user'), V.createOrderValidator, O.createOrder)
router.get('/:id', V.idParamValidator, O.getOrder)
router.patch('/:id/cancel', V.idParamValidator, O.cancelOrder)
router.patch('/:id/pay', allowedTo('admin'), V.idParamValidator, O.markPaid)
router.patch('/:id/deliver', allowedTo('admin'), V.idParamValidator, O.markDelivered)
export default router
