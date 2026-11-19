import { subCategoryModel } from '../../DB/models/subCategory.model.js'
import { productModel } from '../../DB/models/product.model.js'
import ApiError from '../../utils/ApiError.js'
import * as factory from '../../utils/handlerFactory.js'

export const getSubCategories = factory.getAll(subCategoryModel, ['name'], {
  populate: { path: 'category', select: 'name' },
  baseFilter: (req) => (req.params.categoryId ? { category: req.params.categoryId } : {}),
})
export const getSubCategory = factory.getOne(subCategoryModel, { path: 'category', select: 'name' })
export const createSubCategory = factory.createOne(subCategoryModel, ['name', 'category'])
export const updateSubCategory = factory.updateOne(subCategoryModel, ['name', 'category'])

export const deleteSubCategory = async (req, res) => {
  const sub = await subCategoryModel.findById(req.params.id)
  if (!sub) throw new ApiError(`No subCategory found for id ${req.params.id}`, 404)
  if (await productModel.exists({ subcategories: sub._id }))
    throw new ApiError('Cannot delete a subCategory that is used by products', 409)
  await sub.deleteOne()
  res.status(204).send()
}
