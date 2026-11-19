import { http } from '@/lib/http'
import type { ListResponse, Order, Product } from '@/types/api'

const total = async (url: string, params: Record<string, string | number> = {}) =>
  (await http.get<ListResponse<unknown>>(url, { params: { limit: 1, ...params } })).data.pagination.total

const MAX_PAGES = 5 // 500 most recent orders

/** Operational overview built only from existing list endpoints (there is no analytics endpoint in the API). */
export const loadOverview = async () => {
  const [products, categories, brands, users, orders, pending, delivered, cancelled, lowStock, recent] = await Promise.all([
    total('/products'), total('/categories'), total('/brands'), total('/users'), total('/orders'),
    total('/orders', { status: 'pending' }), total('/orders', { status: 'delivered' }), total('/orders', { status: 'cancelled' }),
    http.get<ListResponse<Product>>('/products', { params: { 'quantity[lte]': 5, sort: 'quantity', limit: 6, fields: 'title,quantity,imageCover' } }).then((r) => r.data.data),
    http.get<ListResponse<Order>>('/orders', { params: { sort: '-createdAt', limit: 6 } }).then((r) => r.data.data),
  ])

  const live: Order[] = []
  let truncated = false
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = (await http.get<ListResponse<Order>>('/orders', { params: { 'status[ne]': 'cancelled', sort: '-createdAt', limit: 100, page, fields: 'totalPrice,createdAt,status' } })).data
    live.push(...r.data)
    if (page >= r.pagination.pages) break
    if (page === MAX_PAGES) truncated = true
  }
  return { products, categories, brands, users, orders, pending, delivered, cancelled, lowStock, recent, live, truncated }
}

export const localDay = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const dailyRevenue = (orders: Pick<Order, 'totalPrice' | 'createdAt'>[], days = 14, now = new Date()) => {
  const map = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    map.set(localDay(d), 0)
  }
  for (const o of orders) {
    const k = localDay(new Date(o.createdAt))
    if (map.has(k)) map.set(k, Math.round(((map.get(k) ?? 0) + o.totalPrice) * 100) / 100)
  }
  return [...map].map(([date, value]) => ({ date, value }))
}
