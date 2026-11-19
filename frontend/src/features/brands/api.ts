import { http } from '@/lib/http'
import type { Brand, ItemResponse, ListResponse } from '@/types/api'

export const brandsApi = {
  list: async (params: Record<string, string | number> = { limit: 100, sort: 'name' }) =>
    (await http.get<ListResponse<Brand>>('/brands', { params })).data,
  get: async (id: string) => (await http.get<ItemResponse<Brand>>(`/brands/${id}`)).data.data,
  create: async (body: FormData) => (await http.post<ItemResponse<Brand>>('/brands', body)).data.data,
  update: async (id: string, body: FormData) => (await http.patch<ItemResponse<Brand>>(`/brands/${id}`, body)).data.data,
  remove: async (id: string) => { await http.delete(`/brands/${id}`) },
}
