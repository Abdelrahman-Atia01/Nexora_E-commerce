import mongoose, { Schema } from 'mongoose'

const cartSchema = new Schema(
  {
    user: { type: Schema.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        product: { type: Schema.ObjectId, ref: 'product', required: true },
        quantity: { type: Number, default: 1, min: 1 },
        color: String,
        price: { type: Number, required: true }, // unit price snapshot (after discount if any)
      },
    ],
    totalPrice: { type: Number, default: 0 },
    totalAfterDiscount: Number,
    coupon: String,
  },
  { timestamps: true }
)

cartSchema.methods.calcTotals = function () {
  this.totalPrice = Math.round(this.items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100
  // any change to the cart invalidates the applied coupon
  this.totalAfterDiscount = undefined
  this.coupon = undefined
  return this
}

export const cartModel = mongoose.model('cart', cartSchema)
