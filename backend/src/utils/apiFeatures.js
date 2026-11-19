const CONTROL_FIELDS = ['page', 'sort', 'limit', 'fields', 'keyword']
const FORBIDDEN = ['password', 'passwordResetCode', 'passwordResetExpires', 'passwordResetVerified']
const OPERATORS = ['gte', 'gt', 'lte', 'lt', 'in', 'ne']
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Builds filter / sort / fields / search / pagination from the query string.
 *  ?price[gte]=10&category=<id>&sort=-price,title&fields=title,price&keyword=shirt&page=2&limit=10
 * Only whitelisted operators are accepted, so Mongo operator injection is impossible.
 */
export default class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery
    this.queryString = queryString || {}
    this.pagination = {}
  }

  filter() {
    const filter = {}
    for (const [key, value] of Object.entries(this.queryString)) {
      if (CONTROL_FIELDS.includes(key) || key.startsWith('$') || FORBIDDEN.includes(key)) continue
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const ops = {}
        for (const [op, v] of Object.entries(value)) {
          if (!OPERATORS.includes(op)) continue
          ops[`$${op}`] = op === 'in' ? String(v).split(',') : v
        }
        if (Object.keys(ops).length) filter[key] = ops
      } else if (typeof value === 'string' || Array.isArray(value)) {
        filter[key] = Array.isArray(value) ? { $in: value } : value
      }
    }
    this.mongooseQuery = this.mongooseQuery.find(filter)
    return this
  }

  search(fields = []) {
    const keyword = this.queryString.keyword
    if (keyword && typeof keyword === 'string' && fields.length) {
      const re = new RegExp(escapeRegex(keyword), 'i')
      this.mongooseQuery = this.mongooseQuery.find({ $or: fields.map((f) => ({ [f]: re })) })
    }
    return this
  }

  sort(defaultSort = '-createdAt') {
    const s = typeof this.queryString.sort === 'string' ? this.queryString.sort.split(',').join(' ') : defaultSort
    this.mongooseQuery = this.mongooseQuery.sort(s)
    return this
  }

  limitFields() {
    const requested = typeof this.queryString.fields === 'string' ? this.queryString.fields.split(',').filter((x) => x && !FORBIDDEN.includes(x.replace(/^-/, ''))) : []
    const f = requested.length ? requested.join(' ') : '-__v'
    this.mongooseQuery = this.mongooseQuery.select(f)
    return this
  }

  paginate() {
    const page = Math.max(parseInt(this.queryString.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(this.queryString.limit) || 10, 1), 100)
    this.pagination = { page, limit }
    this.mongooseQuery = this.mongooseQuery.skip((page - 1) * limit).limit(limit)
    return this
  }
}
