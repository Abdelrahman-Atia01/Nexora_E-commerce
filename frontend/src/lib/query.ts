// Catalog filters <-> URL query string. The URL is the single source of truth so filters survive
// reloads, sharing and the back button.
export interface CatalogFilters {
  q: string
  page: number
  sort: string
  category: string
  subcategory: string
  brand: string
  min: string
  max: string
  inStock: boolean
  onSale: boolean
}

export const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest' },
  { value: '-sold', label: 'Best selling' },
  { value: '-ratingsAverage', label: 'Top rated' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: 'title', label: 'Name: A–Z' },
] as const

export const PAGE_SIZE = 12

const one = (v: unknown): string => (Array.isArray(v) ? String(v[0] ?? '') : v == null ? '' : String(v))
const numStr = (v: string): string => (v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 ? v : '')

export const parseFilters = (query: Record<string, unknown>): CatalogFilters => {
  const sort = one(query.sort)
  const page = parseInt(one(query.page), 10)
  return {
    q: one(query.q).trim(),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : '-createdAt',
    category: one(query.category),
    subcategory: one(query.sub),
    brand: one(query.brand),
    min: numStr(one(query.min)),
    max: numStr(one(query.max)),
    inStock: one(query.inStock) === '1',
    onSale: one(query.onSale) === '1',
  }
}

export const serializeFilters = (f: Partial<CatalogFilters>): Record<string, string> => {
  const out: Record<string, string> = {}
  if (f.q) out.q = f.q
  if (f.page && f.page > 1) out.page = String(f.page)
  if (f.sort && f.sort !== '-createdAt') out.sort = f.sort
  if (f.category) out.category = f.category
  if (f.subcategory) out.sub = f.subcategory
  if (f.brand) out.brand = f.brand
  if (f.min) out.min = f.min
  if (f.max) out.max = f.max
  if (f.inStock) out.inStock = '1'
  if (f.onSale) out.onSale = '1'
  return out
}

/** Builds the exact query-string params the backend's ApiFeatures understands. */
export const toApiParams = (f: CatalogFilters, limit = PAGE_SIZE): Record<string, string | number> => {
  const p: Record<string, string | number> = { page: f.page, limit, sort: f.sort }
  if (f.q) p.keyword = f.q
  if (f.category) p.category = f.category
  if (f.subcategory) p.subcategories = f.subcategory
  if (f.brand) p.brand = f.brand
  if (f.min) p['price[gte]'] = f.min
  if (f.max) p['price[lte]'] = f.max
  if (f.inStock) p['quantity[gt]'] = 0
  if (f.onSale) p['priceAfterDiscount[gt]'] = 0
  return p
}

export const activeFilterCount = (f: CatalogFilters, ignore: (keyof CatalogFilters)[] = []): number =>
  (['category', 'subcategory', 'brand', 'min', 'max', 'inStock', 'onSale'] as const)
    .filter((k) => !ignore.includes(k))
    .reduce((n, k) => n + (f[k] ? 1 : 0), 0)
