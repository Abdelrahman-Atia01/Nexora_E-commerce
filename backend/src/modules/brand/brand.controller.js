import { brandModel } from '../../DB/models/brand.model.js'
import { productModel } from '../../DB/models/product.model.js'
import ApiError from '../../utils/ApiError.js'
import * as factory from '../../utils/handlerFactory.js'

export const getBrands = factory.getAll(brandModel, ['name'])
export const getBrand = factory.getOne(brandModel)
export const createBrand = factory.createOne(brandModel, ['name', 'image'])
export const updateBrand = factory.updateOne(brandModel, ['name', 'image'])

export const deleteBrand = async (req, res) => {
  const brand = await brandModel.findById(req.params.id)
  if (!brand) throw new ApiError(`No brand found for id ${req.params.id}`, 404)
  if (await productModel.exists({ brand: brand._id })) throw new ApiError('Cannot delete a brand that still has products', 409)
  await brand.deleteOne()
  res.status(204).send()
}
