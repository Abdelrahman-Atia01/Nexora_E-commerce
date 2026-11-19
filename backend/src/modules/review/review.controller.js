import { reviewModel } from '../../DB/models/review.model.js'
import ApiError from '../../utils/ApiError.js'
import * as factory from '../../utils/handlerFactory.js'

const populate = { path: 'user', select: 'userName image' }

// supports nested route: /products/:productId/reviews
export const setProductInBody = (req, res, next) => {
  if (!req.body.product && req.params.productId) req.body.product = req.params.productId
  next()
}

export const getReviews = factory.getAll(reviewModel, ['comment'], {
  populate,
  baseFilter: (req) => (req.params.productId ? { product: req.params.productId } : {}),
})
export const getReview = factory.getOne(reviewModel, populate)

export const createReview = async (req, res) => {
  const { rating, comment, product } = req.body
  const review = await reviewModel.create({ rating, comment, product, user: req.user._id }) // duplicate -> 409 via unique index
  res.status(201).json({ status: 'success', data: review })
}

const ownReview = async (req) => {
  const review = await reviewModel.findById(req.params.id)
  if (!review) throw new ApiError(`No review found for id ${req.params.id}`, 404)
  return review
}

export const updateReview = async (req, res) => {
  const review = await ownReview(req)
  if (review.user.toString() !== req.user.id) throw new ApiError('You can only edit your own review', 403)
  review.set({ rating: req.body.rating ?? review.rating, comment: req.body.comment ?? review.comment })
  await review.save()
  res.status(200).json({ status: 'success', data: review })
}

export const deleteReview = async (req, res) => {
  const review = await ownReview(req)
  if (req.user.role !== 'admin' && review.user.toString() !== req.user.id)
    throw new ApiError('You can only delete your own review', 403)
  await review.deleteOne()
  res.status(204).send()
}
