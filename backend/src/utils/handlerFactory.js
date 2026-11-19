import ApiError from './ApiError.js'
import ApiFeatures from './apiFeatures.js'

// Generic CRUD handlers shared by the catalog modules.
// Express 5 forwards rejected promises to the error middleware, so no try/catch is needed.

export const getAll = (Model, searchFields = [], { populate, baseFilter } = {}) => async (req, res) => {
  const base = typeof baseFilter === 'function' ? baseFilter(req) : {}
  const build = () => {
    const f = new ApiFeatures(Model.find(), req.query).filter().search(searchFields)
    // $and so a client-supplied filter (?user=...) can never override the server-side restriction
    if (Object.keys(base).length) f.mongooseQuery = f.mongooseQuery.and([base])
    return f
  }
  const total = await Model.countDocuments(build().mongooseQuery.getFilter())
  const features = build().sort().limitFields().paginate()
  if (populate) features.mongooseQuery = features.mongooseQuery.populate(populate)
  const data = await features.mongooseQuery
  const { page, limit } = features.pagination
  res.status(200).json({
    status: 'success',
    results: data.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data,
  })
}

export const getOne = (Model, populate) => async (req, res) => {
  let q = Model.findById(req.params.id)
  if (populate) q = q.populate(populate)
  const doc = await q
  if (!doc) throw new ApiError(`No ${Model.modelName} found for id ${req.params.id}`, 404)
  res.status(200).json({ status: 'success', data: doc })
}

// whitelist body fields (prevents mass-assignment of slug, ratings, _id ...)
const pick = (body, allowed) =>
  allowed ? Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k))) : body

export const createOne = (Model, allowed) => async (req, res) => {
  const doc = await Model.create(pick(req.body, allowed))
  res.status(201).json({ status: 'success', data: doc })
}

export const updateOne = (Model, allowed) => async (req, res) => {
  const doc = await Model.findById(req.params.id)
  if (!doc) throw new ApiError(`No ${Model.modelName} found for id ${req.params.id}`, 404)
  doc.set(pick(req.body, allowed))
  await doc.save() // runs validators + hooks (slug, rating recalculation...)
  res.status(200).json({ status: 'success', data: doc })
}

export const deleteOne = (Model) => async (req, res) => {
  const doc = await Model.findById(req.params.id)
  if (!doc) throw new ApiError(`No ${Model.modelName} found for id ${req.params.id}`, 404)
  await doc.deleteOne()
  res.status(204).send()
}
