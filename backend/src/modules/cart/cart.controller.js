import { cartModel } from '../../DB/models/cart.model.js'
import { productModel } from '../../DB/models/product.model.js'
import { couponModel } from '../../DB/models/coupon.model.js'
import ApiError from '../../utils/ApiError.js'

const unitPrice = (p) => p.priceAfterDiscount ?? p.price
const send = (res, cart, status = 200) =>
  res.status(status).json({ status: 'success', results: cart?.items.length ?? 0, data: cart })
const populateCart = (q) => q.populate('items.product', 'title imageCover quantity')

export const getCart = async (req, res) => {
  const cart = await populateCart(cartModel.findOne({ user: req.user.id }))
  send(res, cart ?? { items: [], totalPrice: 0 })
}

export const addToCart = async (req, res) => {
  const { productId, color } = req.body
  const quantity = req.body.quantity || 1
  const product = await productModel.findById(productId)
  if (!product) throw new ApiError('Product not found', 404)
  if (color && product.colors.length && !product.colors.includes(color)) throw new ApiError(`Color "${color}" is not available`, 400)

  const cart = (await cartModel.findOne({ user: req.user.id })) ?? new cartModel({ user: req.user.id, items: [] })
  const item = cart.items.find((i) => i.product.toString() === productId && i.color === color)
  const newQty = (item?.quantity ?? 0) + quantity
  if (newQty > product.quantity) throw new ApiError(`Only ${product.quantity} item(s) in stock`, 400)

  if (item) {
    item.quantity = newQty
    item.price = unitPrice(product)
  } else {
    cart.items.push({ product: productId, quantity, color, price: unitPrice(product) })
  }
  cart.calcTotals()
  await cart.save()
  send(res, await populateCart(cartModel.findById(cart.id)), 201)
}

const findCart = async (userId) => {
  const cart = await cartModel.findOne({ user: userId })
  if (!cart) throw new ApiError('Your cart is empty', 404)
  return cart
}

export const updateItemQuantity = async (req, res) => {
  const cart = await findCart(req.user.id)
  const item = cart.items.id(req.params.itemId)
  if (!item) throw new ApiError('Item not found in cart', 404)
  const product = await productModel.findById(item.product)
  if (!product) throw new ApiError('Product no longer exists', 404)
  if (req.body.quantity > product.quantity) throw new ApiError(`Only ${product.quantity} item(s) in stock`, 400)
  item.quantity = req.body.quantity
  item.price = unitPrice(product)
  cart.calcTotals()
  await cart.save()
  send(res, await populateCart(cartModel.findById(cart.id)))
}

export const removeItem = async (req, res) => {
  const cart = await findCart(req.user.id)
  const item = cart.items.id(req.params.itemId)
  if (!item) throw new ApiError('Item not found in cart', 404)
  item.deleteOne()
  cart.calcTotals()
  await cart.save()
  send(res, await populateCart(cartModel.findById(cart.id)))
}

export const clearCart = async (req, res) => {
  await cartModel.findOneAndDelete({ user: req.user.id })
  res.status(204).send()
}

export const applyCoupon = async (req, res) => {
  const coupon = await couponModel.findOne({ name: req.body.coupon.toUpperCase(), expire: { $gt: new Date() } })
  if (!coupon) throw new ApiError('Coupon is invalid or expired', 400)
  const cart = await findCart(req.user.id)
  cart.coupon = coupon.name
  cart.totalAfterDiscount = Math.round(cart.totalPrice * (1 - coupon.discount / 100) * 100) / 100
  await cart.save()
  send(res, await populateCart(cartModel.findById(cart.id)))
}
