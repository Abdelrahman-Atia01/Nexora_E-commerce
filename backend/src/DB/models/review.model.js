import mongoose, { Schema } from 'mongoose'
import { productModel } from './product.model.js'

const reviewSchema = new Schema(
  {
    comment: { type: String, trim: true, maxLength: [1000, 'comment is too long'] },
    rating: {
      type: Number,
      required: [true, 'rating is required'],
      min: [1, 'rating must be between 1 and 5'],
      max: [5, 'rating must be between 1 and 5'],
    },
    user: { type: Schema.ObjectId, ref: 'User', required: [true, 'review must belong to a user'] },
    product: { type: Schema.ObjectId, ref: 'product', required: [true, 'review must belong to a product'], index: true },
  },
  { timestamps: true }
)

// one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true })

reviewSchema.statics.recalculate = async function (productId) {
  const [stats] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  await productModel.findByIdAndUpdate(productId, {
    ratingsAverage: stats ? Math.round(stats.avg * 10) / 10 : 0,
    ratingsQuantity: stats ? stats.count : 0,
  })
}

reviewSchema.post('save', (doc) => doc.constructor.recalculate(doc.product))
reviewSchema.post('deleteOne', { document: true, query: false }, (doc) => doc.constructor.recalculate(doc.product))

export const reviewModel = mongoose.model('review', reviewSchema)
