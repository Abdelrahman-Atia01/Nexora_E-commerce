import mongoose, { Schema } from 'mongoose'
import slugify from 'slugify'

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'product title is required'],
      trim: true,
      minLength: [3, 'product title must be at least 3 characters'],
      maxLength: [100, 'product title must be at most 100 characters'],
    },
    slug: { type: String, lowercase: true, index: true },
    description: {
      type: String,
      required: [true, 'product description is required'],
      trim: true,
      minLength: [20, 'product description must be at least 20 characters'],
      maxLength: [2000, 'product description must be at most 2000 characters'],
    },
    quantity: { type: Number, required: [true, 'product quantity is required'], min: [0, 'quantity cannot be negative'] },
    sold: { type: Number, default: 0, min: 0 },
    price: {
      type: Number,
      required: [true, 'product price is required'],
      min: [0, 'price cannot be negative'],
      max: [99999999, 'price is too large'],
    },
    priceAfterDiscount: {
      type: Number,
      min: [0, 'priceAfterDiscount cannot be negative'],
      validate: {
        validator: function (v) {
          return v == null || this.price == null || v < this.price
        },
        message: 'priceAfterDiscount must be lower than price',
      },
    },
    colors: [String],
    imageCover: { type: String, required: [true, 'product imageCover is required'] },
    images: [String],
    category: { type: Schema.ObjectId, ref: 'category', required: [true, 'product must belong to a category'], index: true },
    subcategories: [{ type: Schema.ObjectId, ref: 'subCategory' }],
    brand: { type: Schema.ObjectId, ref: 'brand', index: true },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'rating must be above or equal 0'],
      max: [5, 'rating must be below or equal 5'],
    },
    ratingsQuantity: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

productSchema.index({ title: 'text', description: 'text' })
productSchema.index({ price: 1 })

productSchema.virtual('reviews', { ref: 'review', localField: '_id', foreignField: 'product' })

productSchema.pre('validate', function () {
  if (this.isModified('title')) this.slug = slugify(this.title, { lower: true, strict: true })
})

export const productModel = mongoose.model('product', productSchema)
