import { userModel } from '../../DB/models/user.model.js'
import ApiError from '../../utils/ApiError.js'
import { signToken } from '../../utils/token.js'
import * as factory from '../../utils/handlerFactory.js'

const PROFILE_FIELDS = ['userName', 'phone', 'gender', 'BDD', 'image']
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]))

// ---------- logged-in user
export const getMe = (req, res) => res.status(200).json({ status: 'success', data: req.user })

export const updateMe = async (req, res) => {
  req.user.set(pick(req.body, PROFILE_FIELDS))
  await req.user.save()
  res.status(200).json({ status: 'success', data: req.user })
}

export const changeMyPassword = async (req, res) => {
  const user = await userModel.findById(req.user.id).select('+password')
  if (!(await user.comparePassword(req.body.currentPassword))) throw new ApiError('Current password is incorrect', 400)
  user.password = req.body.newPassword
  await user.save()
  res.status(200).json({ status: 'success', token: signToken({ id: user.id }), message: 'Password updated' })
}

export const deactivateMe = async (req, res) => {
  await userModel.findByIdAndUpdate(req.user.id, { active: false })
  res.status(204).send()
}

// ---------- addresses
export const getAddresses = (req, res) =>
  res.status(200).json({ status: 'success', results: req.user.addresses.length, data: req.user.addresses })

export const addAddress = async (req, res) => {
  req.user.addresses.push(pick(req.body, ['alias', 'details', 'phone', 'city', 'postalCode']))
  await req.user.save()
  res.status(201).json({ status: 'success', data: req.user.addresses })
}

export const removeAddress = async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId)
  if (!address) throw new ApiError('Address not found', 404)
  address.deleteOne()
  await req.user.save()
  res.status(200).json({ status: 'success', data: req.user.addresses })
}

// ---------- admin
export const getUsers = factory.getAll(userModel, ['userName', 'email'])
export const getUser = factory.getOne(userModel)
export const createUser = factory.createOne(userModel, ['userName', 'email', 'password', 'role', 'phone', 'gender', 'BDD'])
export const updateUser = factory.updateOne(userModel, ['userName', 'phone', 'gender', 'BDD', 'role', 'active'])

export const deleteUser = async (req, res) => {
  if (req.params.id === req.user.id) throw new ApiError('You cannot delete your own account here', 400)
  return factory.deleteOne(userModel)(req, res)
}
