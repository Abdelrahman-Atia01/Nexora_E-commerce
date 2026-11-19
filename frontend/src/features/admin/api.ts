import { http } from '@/lib/http'
import type { Coupon, ItemResponse, ListResponse } from '@/types/api'

export const couponsApi = {
  list: async (params: Record<string, string | number>) => (await http.get<ListResponse<Coupon>>('/coupons', { params })).data,
  create: async (b: { name: string; expire: string; discount: number }) => (await http.post<ItemResponse<Coupon>>('/coupons', b)).data.data,
  update: async (id: string, b: Partial<{ name: string; expire: string; discount: number }>) => (await http.patch<ItemResponse<Coupon>>(`/coupons/${id}`, b)).data.data,
  remove: async (id: string) => { await http.delete(`/coupons/${id}`) },
}
