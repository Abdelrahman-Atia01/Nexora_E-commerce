import { http } from '@/lib/http'
import type { ItemResponse, ListResponse, Product } from '@/types/api'

type Params = Record<string, string | number | undefined>
const clean = (p: Params): Params => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== ''))

export const productsApi = {
  list: async (params: Params, signal?: AbortSignal) =>
    (await http.get<ListResponse<Product>>('/products', { params: clean(params), signal })).data,
  get: async (id: string, signal?: AbortSignal) => (await http.get<ItemResponse<Product>>(`/products/${id}`, { signal })).data.data,
  create: async (body: FormData) => (await http.post<ItemResponse<Product>>('/products', body)).data.data,
  update: async (id: string, body: FormData | Record<string, unknown>) => (await http.patch<ItemResponse<Product>>(`/products/${id}`, body)).data.data,
  remove: async (id: string) => { await http.delete(`/products/${id}`) },
}
