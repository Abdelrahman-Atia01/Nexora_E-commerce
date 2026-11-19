import { productModel } from '../../DB/models/product.model.js'
import * as factory from '../../utils/handlerFactory.js'

const populate = [
  { path: 'category', select: 'name slug' },
  { path: 'brand', select: 'name slug' },
]

export const getProducts = factory.getAll(productModel, ['title', 'description'], { populate })
export const getProduct = factory.getOne(productModel, [...populate, { path: 'subcategories', select: 'name' }, { path: 'reviews', populate: { path: 'user', select: 'userName image' } }])
const FIELDS = ['title', 'description', 'quantity', 'sold', 'price', 'priceAfterDiscount', 'colors', 'imageCover', 'images', 'category', 'subcategories', 'brand']
export const createProduct = factory.createOne(productModel, FIELDS)
export const updateProduct = factory.updateOne(productModel, FIELDS)
export const deleteProduct = factory.deleteOne(productModel)
