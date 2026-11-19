import mongoose, { Schema } from 'mongoose'

const orderSchema = new Schema(
  {
    user: { type: Schema.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        product: { type: Schema.ObjectId, ref: 'product', required: true },
        title: String,
        quantity: Number,
        color: String,
        price: Number,
      },
    ],
    shippingAddress: {
      details: { type: String, required: true },
      phone: { type: String, required: true },
      city: String,
      postalCode: String,
    },
    itemsPrice: Number,
    discount: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    totalPrice: Number,
    coupon: String,
    paymentMethod: { type: String, enum: ['cash'], default: 'cash' },
    status: { type: String, enum: ['pending', 'delivered', 'cancelled'], default: 'pending', index: true },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
)

export const orderModel = mongoose.model('order', orderSchema)
