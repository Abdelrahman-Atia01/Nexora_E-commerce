import { categoryModel } from '../../DB/models/category.model.js'
import { subCategoryModel } from '../../DB/models/subCategory.model.js'
import { productModel } from '../../DB/models/product.model.js'
import ApiError from '../../utils/ApiError.js'
import * as factory from '../../utils/handlerFactory.js'

export const getCategories = factory.getAll(categoryModel, ['name'])
export const getCategory = factory.getOne(categoryModel)
export const createCategory = factory.createOne(categoryModel, ['name', 'image'])
export const updateCategory = factory.updateOne(categoryModel, ['name', 'image'])

export const deleteCategory = async (req, res) => {
  const category = await categoryModel.findById(req.params.id)
  if (!category) throw new ApiError(`No category found for id ${req.params.id}`, 404)
  if (await productModel.exists({ category: category._id }))
    throw new ApiError('Cannot delete a category that still has products', 409)
  await subCategoryModel.deleteMany({ category: category._id })
  await category.deleteOne()
  res.status(204).send()
}
