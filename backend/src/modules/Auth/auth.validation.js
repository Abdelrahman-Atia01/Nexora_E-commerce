import { body } from 'express-validator'
import { validate } from '../../middlewares/validate.js'

export const passwordRule = (field = 'password') =>
  body(field)
    .exists({ values: 'falsy' }).withMessage(`${field} is required`).bail()
    .isString().isLength({ min: 8, max: 64 }).withMessage('password must be 8-64 characters')
    .matches(/[A-Za-z]/).withMessage('password must contain a letter')
    .matches(/\d/).withMessage('password must contain a number')

const email = body('email').exists({ values: 'falsy' }).withMessage('email is required').bail().isEmail().withMessage('invalid email format').normalizeEmail()

export const signupValidator = [
  body('userName').exists({ values: 'falsy' }).withMessage('userName is required').bail().isString().trim().isLength({ min: 3, max: 30 }).withMessage('userName must be 3-30 characters'),
  email,
  passwordRule(),
  body('confirmPassword').exists({ values: 'falsy' }).withMessage('confirmPassword is required').bail()
    .custom((v, { req }) => v === req.body.password).withMessage('passwords do not match'),
  body('gender').optional().isIn(['male', 'female', 'not specified']).withMessage('gender must be male, female or not specified'),
  body('phone').optional().matches(/^[0-9+\-\s]{7,16}$/).withMessage('invalid phone number'),
  validate,
]
export const loginValidator = [
  email,
  body('password').exists({ values: 'falsy' }).withMessage('password is required'),
  validate,
]
export const forgotPasswordValidator = [email, validate]
export const verifyResetCodeValidator = [
  email,
  body('code').exists({ values: 'falsy' }).withMessage('code is required').bail().isString().isLength({ min: 6, max: 6 }).withMessage('code must be 6 digits'),
  validate,
]
export const resetPasswordValidator = [email, passwordRule('newPassword'), validate]
