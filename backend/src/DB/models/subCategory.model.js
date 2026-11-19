import mongoose, { Schema } from 'mongoose'
import slugify from 'slugify'

const subCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'subCategory name is required'],
      trim: true,
      minLength: [2, 'subCategory name must be at least 2 characters'],
      maxLength: [32, 'subCategory name must be at most 32 characters'],
    },
    slug: { type: String, lowercase: true, index: true },
    category: { type: Schema.ObjectId, ref: 'category', required: [true, 'subCategory must belong to a parent category'] },
  },
  { timestamps: true }
)

// the same sub-category name is allowed under different categories, but not twice in one
subCategorySchema.index({ category: 1, name: 1 }, { unique: true })

subCategorySchema.pre('validate', function () {
  if (this.isModified('name')) this.slug = slugify(this.name, { lower: true, strict: true })
})

export const subCategoryModel = mongoose.model('subCategory', subCategorySchema)
