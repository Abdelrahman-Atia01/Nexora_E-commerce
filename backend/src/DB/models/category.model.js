import mongoose, { Schema } from 'mongoose'
import slugify from 'slugify'

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'category name is required'],
      unique: true,
      trim: true,
      minLength: [3, 'category name must be at least 3 characters'],
      maxLength: [35, 'category name must be at most 35 characters'],
    },
    slug: { type: String, lowercase: true, index: true },
    image: String,
  },
  { timestamps: true }
)

categorySchema.pre('validate', function () {
  if (this.isModified('name')) this.slug = slugify(this.name, { lower: true, strict: true })
})

export const categoryModel = mongoose.model('category', categorySchema)
