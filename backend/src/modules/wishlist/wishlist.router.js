import { Router } from 'express'
import { body } from 'express-validator'
import { userModel } from '../../DB/models/user.model.js'
import { productModel } from '../../DB/models/product.model.js'
import ApiError from '../../utils/ApiError.js'
import { protect } from '../../middlewares/auth.js'
import { validate, idValidator } from '../../middlewares/validate.js'

const router = Router()
router.use(protect)

router.get('/', async (req, res) => {
  const user = await userModel.findById(req.user.id).populate('wishlist', 'title price priceAfterDiscount imageCover ratingsAverage')
  res.status(200).json({ status: 'success', results: user.wishlist.length, data: user.wishlist })
})

router.post('/',
  body('productId').exists().withMessage('productId is required').bail().isMongoId().withMessage('invalid product id'),
  validate,
  async (req, res) => {
    if (!(await productModel.exists({ _id: req.body.productId }))) throw new ApiError('Product not found', 404)
    const user = await userModel.findByIdAndUpdate(req.user.id, { $addToSet: { wishlist: req.body.productId } }, { new: true })
    res.status(200).json({ status: 'success', message: 'Added to wishlist', data: user.wishlist })
  })

router.delete('/:productId', idValidator('productId'), async (req, res) => {
  const user = await userModel.findByIdAndUpdate(req.user.id, { $pull: { wishlist: req.params.productId } }, { new: true })
  res.status(200).json({ status: 'success', message: 'Removed from wishlist', data: user.wishlist })
})

export default router
