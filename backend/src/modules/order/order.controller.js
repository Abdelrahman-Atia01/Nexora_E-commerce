import { orderModel } from '../../DB/models/order.model.js'
import { cartModel } from '../../DB/models/cart.model.js'
import { productModel } from '../../DB/models/product.model.js'
import { couponModel } from '../../DB/models/coupon.model.js'
import ApiError from '../../utils/ApiError.js'
import * as factory from '../../utils/handlerFactory.js'
import { config } from '../../config/index.js'

const round = (n) => Math.round(n * 100) / 100

// Atomically reserve stock for each item; if one fails, roll back the ones already reserved.
// (No multi-document transaction needed, so it works on a standalone MongoDB too.)
const reserveStock = async (items) => {
  const done = []
  try {
    for (const i of items) {
      const r = await productModel.updateOne(
        { _id: i.product, quantity: { $gte: i.quantity } },
        { $inc: { quantity: -i.quantity, sold: i.quantity } }
      )
      if (r.modifiedCount !== 1) throw new ApiError(`"${i.title}" is out of stock or has insufficient quantity`, 409)
      done.push(i)
    }
  } catch (err) {
    await releaseStock(done)
    throw err
  }
}
const releaseStock = (items) =>
  Promise.all(items.map((i) => productModel.updateOne({ _id: i.product }, { $inc: { quantity: i.quantity, sold: -i.quantity } })))

// Creates a cash order from the user's cart. Prices are re-read from the DB (never trusted from the cart).
export const createOrder = async (req, res) => {
  const cart = await cartModel.findOne({ user: req.user.id })
  if (!cart || !cart.items.length) throw new ApiError('Your cart is empty', 400)

  const products = await productModel.find({ _id: { $in: cart.items.map((i) => i.product) } })
  const byId = new Map(products.map((p) => [p.id, p]))
  const items = cart.items.map((i) => {
    const p = byId.get(i.product.toString())
    if (!p) throw new ApiError('A product in your cart no longer exists, please update your cart', 409)
    return { product: p._id, title: p.title, quantity: i.quantity, color: i.color, price: p.priceAfterDiscount ?? p.price }
  })

  const itemsPrice = round(items.reduce((s, i) => s + i.price * i.quantity, 0))
  let discount = 0
  if (cart.coupon) {
    const coupon = await couponModel.findOne({ name: cart.coupon, expire: { $gt: new Date() } })
    if (coupon) discount = round((itemsPrice * coupon.discount) / 100)
  }
  const taxPrice = round((itemsPrice - discount) * config.taxRate)
  const shippingPrice = config.shippingPrice
  const totalPrice = round(itemsPrice - discount + taxPrice + shippingPrice)

  await reserveStock(items)
  let order
  try {
    order = await orderModel.create({
      user: req.user.id, items, shippingAddress: req.body.shippingAddress,
      itemsPrice, discount, taxPrice, shippingPrice, totalPrice, coupon: discount ? cart.coupon : undefined,
    })
  } catch (err) {
    await releaseStock(items)
    throw err
  }
  await cartModel.deleteOne({ _id: cart._id })
  res.status(201).json({ status: 'success', data: order })
}

// users see only their own orders, admins see all
export const getOrders = factory.getAll(orderModel, [], {
  populate: { path: 'user', select: 'userName email' },
  baseFilter: (req) => (req.user.role === 'admin' ? {} : { user: req.user.id }),
})

const findOrder = async (req) => {
  const order = await orderModel.findById(req.params.id)
  if (!order) throw new ApiError('Order not found', 404)
  if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) throw new ApiError('Order not found', 404)
  return order
}

export const getOrder = async (req, res) => {
  res.status(200).json({ status: 'success', data: await findOrder(req) })
}

export const markPaid = async (req, res) => {
  const order = await findOrder(req)
  if (order.status === 'cancelled') throw new ApiError('Order is cancelled', 400)
  if (order.isPaid) throw new ApiError('Order is already paid', 400)
  order.isPaid = true
  order.paidAt = new Date()
  await order.save()
  res.status(200).json({ status: 'success', data: order })
}

export const markDelivered = async (req, res) => {
  const order = await findOrder(req)
  if (order.status !== 'pending') throw new ApiError(`Order is already ${order.status}`, 400)
  order.status = 'delivered'
  order.isDelivered = true
  order.deliveredAt = new Date()
  if (!order.isPaid) { order.isPaid = true; order.paidAt = order.deliveredAt } // cash on delivery
  await order.save()
  res.status(200).json({ status: 'success', data: order })
}

export const cancelOrder = async (req, res) => {
  const order = await findOrder(req)
  if (order.status !== 'pending') throw new ApiError(`Order is already ${order.status}`, 400)
  order.status = 'cancelled'
  order.cancelledAt = new Date()
  await order.save()
  await releaseStock(order.items)
  res.status(200).json({ status: 'success', data: order })
}
