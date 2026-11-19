import { userModel } from '../../DB/models/user.model.js'
import ApiError from '../../utils/ApiError.js'
import { signToken, verifyToken, sha256, randomCode } from '../../utils/token.js'
import { sendEmail } from '../../utils/sendEmail.js'
import { confirmEmailTemplate, resetCodeTemplate } from '../../utils/templates/emailTemplates.js'
import { config } from '../../config/index.js'

const sendConfirmation = async (user) => {
  const token = signToken({ id: user.id, purpose: 'confirm-email' }, '1d')
  const link = `${config.baseUrl}/api/v1/auth/confirm-email/${token}`
  try {
    await sendEmail({ to: user.email, ...confirmEmailTemplate(user.userName, link) })
  } catch (err) {
    console.error('Failed to send confirmation email:', err.message)
  }
}

export const signup = async (req, res) => {
  const { userName, email, password, gender, phone } = req.body
  if (await userModel.exists({ email })) throw new ApiError('Email already registered', 409)
  const user = await userModel.create({ userName, email, password, gender, phone }) // role is always "user"
  await sendConfirmation(user)

  const body = { status: 'success', message: 'Account created, please check your email to confirm it', data: user }
  if (!config.requireEmailConfirmation) body.token = signToken({ id: user.id })
  res.status(201).json(body)
}

export const confirmEmail = async (req, res) => {
  const decoded = verifyToken(req.params.token)
  if (decoded.purpose !== 'confirm-email') throw new ApiError('Invalid confirmation token', 400)
  const user = await userModel.findByIdAndUpdate(decoded.id, { confirmEmail: true }, { new: true })
  if (!user) throw new ApiError('User not found', 404)
  res.status(200).json({ status: 'success', message: 'Email confirmed, you can login now' })
}

export const login = async (req, res) => {
  const { email, password } = req.body
  const user = await userModel.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) throw new ApiError('Incorrect email or password', 401)
  if (!user.active) throw new ApiError('This account is deactivated', 403)
  if (config.requireEmailConfirmation && !user.confirmEmail) throw new ApiError('Please confirm your email first', 403)
  res.status(200).json({ status: 'success', token: signToken({ id: user.id }), data: user })
}

// Always answers the same way so attackers can't discover which emails exist.
export const forgotPassword = async (req, res) => {
  const user = await userModel.findOne({ email: req.body.email })
  if (user && user.active) {
    const code = randomCode()
    user.passwordResetCode = sha256(code)
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000)
    user.passwordResetVerified = false
    await user.save({ validateBeforeSave: false })
    try {
      await sendEmail({ to: user.email, ...resetCodeTemplate(user.userName, code) })
    } catch (err) {
      console.error('Failed to send reset email:', err.message)
    }
  }
  res.status(200).json({ status: 'success', message: 'If this email exists, a reset code was sent' })
}

export const verifyResetCode = async (req, res) => {
  const user = await userModel
    .findOne({ email: req.body.email, passwordResetCode: sha256(req.body.code), passwordResetExpires: { $gt: new Date() } })
    .select('+passwordResetCode +passwordResetExpires +passwordResetVerified')
  if (!user) throw new ApiError('Reset code is invalid or expired', 400)
  user.passwordResetVerified = true
  await user.save({ validateBeforeSave: false })
  res.status(200).json({ status: 'success', message: 'Code verified' })
}

export const resetPassword = async (req, res) => {
  const user = await userModel
    .findOne({ email: req.body.email, passwordResetVerified: true, passwordResetExpires: { $gt: new Date() } })
    .select('+passwordResetVerified +passwordResetCode +passwordResetExpires')
  if (!user) throw new ApiError('Reset code was not verified or has expired', 400)
  user.password = req.body.newPassword
  user.passwordResetCode = undefined
  user.passwordResetExpires = undefined
  user.passwordResetVerified = undefined
  await user.save()
  res.status(200).json({ status: 'success', token: signToken({ id: user.id }), message: 'Password updated' })
}
