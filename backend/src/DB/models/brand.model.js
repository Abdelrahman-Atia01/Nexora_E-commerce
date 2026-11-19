import mongoose, { Schema } from 'mongoose'
import slugify from 'slugify'

const brandSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'brand name is required'],
      unique: true,
      trim: true,
      minLength: [2, 'brand name must be at least 2 characters'],
      maxLength: [35, 'brand name must be at most 35 characters'],
    },
    slug: { type: String, lowercase: true, index: true },
    image: String,
  },
  { timestamps: true }
)

brandSchema.pre('validate', function () {
  if (this.isModified('name')) this.slug = slugify(this.name, { lower: true, strict: true })
})

export const brandModel = mongoose.model('brand', brandSchema)
