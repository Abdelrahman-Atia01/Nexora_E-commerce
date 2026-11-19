import { body } from 'express-validator'
import { validate, idValidator } from '../../middlewares/validate.js'
import { passwordRule } from '../Auth/auth.validation.js'

const profile = [
  body('userName').optional().isString().trim().isLength({ min: 3, max: 30 }).withMessage('userName must be 3-30 characters'),
  body('phone').optional().matches(/^[0-9+\-\s]{7,16}$/).withMessage('invalid phone number'),
  body('gender').optional().isIn(['male', 'female', 'not specified']).withMessage('gender must be male, female or not specified'),
  body('BDD').optional().isISO8601().withMessage('BDD must be a valid date'),
]
export const updateMeValidator = [...profile, validate]
export const changePasswordValidator = [
  body('currentPassword').exists({ values: 'falsy' }).withMessage('currentPassword is required'),
  passwordRule('newPassword'),
  validate,
]
export const createUserValidator = [
  body('userName').exists({ values: 'falsy' }).withMessage('userName is required').bail().isString().trim().isLength({ min: 3, max: 30 }).withMessage('userName must be 3-30 characters'),
  body('email').exists({ values: 'falsy' }).withMessage('email is required').bail().isEmail().withMessage('invalid email format').normalizeEmail(),
  passwordRule(),
  body('role').optional().isIn(['user', 'admin']).withMessage('role must be user or admin'),
  ...profile.slice(1),
  validate,
]
export const updateUserValidator = [
  ...idValidator(),
  ...profile,
  body('role').optional().isIn(['user', 'admin']).withMessage('role must be user or admin'),
  body('active').optional().isBoolean().withMessage('active must be boolean').toBoolean(),
  validate,
]
export const addressValidator = [
  body('alias').exists({ values: 'falsy' }).withMessage('alias is required').bail().isString().trim(),
  body('details').exists({ values: 'falsy' }).withMessage('details is required').bail().isString().trim(),
  body('phone').optional().matches(/^[0-9+\-\s]{7,16}$/).withMessage('invalid phone number'),
  body('city').optional().isString().trim(),
  body('postalCode').optional().isString().trim(),
  validate,
]
export const idParamValidator = idValidator()
export const addressIdValidator = idValidator('addressId')
