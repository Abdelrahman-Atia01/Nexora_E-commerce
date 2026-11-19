import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as A from './auth.controller.js'
import * as V from './auth.validation.js'

// brute-force protection for credential endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many attempts, please try again later' },
})

const router = Router()
router.post('/signup', authLimiter, V.signupValidator, A.signup)
router.get('/confirm-email/:token', A.confirmEmail)
router.post('/login', authLimiter, V.loginValidator, A.login)
router.post('/forgot-password', authLimiter, V.forgotPasswordValidator, A.forgotPassword)
router.post('/verify-reset-code', authLimiter, V.verifyResetCodeValidator, A.verifyResetCode)
router.patch('/reset-password', authLimiter, V.resetPasswordValidator, A.resetPassword)
export default router
