import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcrypt'
import { config } from '../../config/index.js'

const addressSchema = new Schema({
  alias: { type: String, trim: true, required: [true, 'address alias is required'] },
  details: { type: String, trim: true, required: [true, 'address details are required'] },
  phone: { type: String, trim: true },
  city: { type: String, trim: true },
  postalCode: { type: String, trim: true },
})

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: [true, 'userName is required'],
      trim: true,
      minLength: [3, 'userName must be at least 3 characters'],
      maxLength: [30, 'userName must be at most 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'invalid email format'],
    },
    confirmEmail: { type: Boolean, default: false },
    password: {
      type: String,
      required: [true, 'password is required'],
      minLength: [8, 'password must be at least 8 characters'],
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetCode: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordResetVerified: { type: Boolean, select: false },
    gender: { type: String, enum: { values: ['male', 'female', 'not specified'], message: 'gender must be male, female or not specified' }, default: 'not specified' },
    role: { type: String, enum: { values: ['user', 'admin'], message: 'role must be user or admin' }, default: 'user' },
    active: { type: Boolean, default: true },
    BDD: Date,
    phone: { type: String, trim: true, match: [/^[0-9+\-\s]{7,16}$/, 'invalid phone number'] },
    image: String,
    wishlist: [{ type: Schema.ObjectId, ref: 'product' }],
    addresses: [addressSchema],
  },
  { timestamps: true }
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, config.bcryptRounds)
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000)
})

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

// true if the password changed after the JWT was issued
userSchema.methods.passwordChangedAfter = function (jwtIssuedAt) {
  return !!this.passwordChangedAt && Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIssuedAt
}

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password
    delete ret.passwordResetCode
    delete ret.passwordResetExpires
    delete ret.passwordResetVerified
    delete ret.__v
    return ret
  },
})

export const userModel = mongoose.model('User', userSchema)
