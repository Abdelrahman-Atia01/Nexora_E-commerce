import mongoose, { Schema } from 'mongoose'

const couponSchema = new Schema(
  {
    name: { type: String, trim: true, uppercase: true, required: [true, 'coupon name is required'], unique: true },
    expire: { type: Date, required: [true, 'coupon expiry date is required'] },
    discount: {
      type: Number,
      required: [true, 'coupon discount is required'],
      min: [1, 'discount must be between 1 and 100'],
      max: [100, 'discount must be between 1 and 100'],
    },
  },
  { timestamps: true }
)

export const couponModel = mongoose.model('coupon', couponSchema)
