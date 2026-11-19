import { Router } from 'express'
import * as U from './user.controller.js'
import * as V from './user.validation.js'
import { protect, allowedTo } from '../../middlewares/auth.js'
import { uploadSingleImage } from '../../middlewares/upload.js'

const router = Router()
router.use(protect)

// logged-in user
router.get('/me', U.getMe)
router.patch('/me', uploadSingleImage('users'), V.updateMeValidator, U.updateMe)
router.patch('/me/password', V.changePasswordValidator, U.changeMyPassword)
router.delete('/me', U.deactivateMe)
router.route('/me/addresses').get(U.getAddresses).post(V.addressValidator, U.addAddress)
router.delete('/me/addresses/:addressId', V.addressIdValidator, U.removeAddress)

// admin only
router.use(allowedTo('admin'))
router.route('/').get(U.getUsers).post(V.createUserValidator, U.createUser)
router.route('/:id')
  .get(V.idParamValidator, U.getUser)
  .patch(V.updateUserValidator, U.updateUser)
  .delete(V.idParamValidator, U.deleteUser)
export default router
