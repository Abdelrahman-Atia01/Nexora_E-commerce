import { http } from '@/lib/http'
import type { ItemResponse, ListResponse, Review } from '@/types/api'

export const reviewsApi = {
  forProduct: async (productId: string, params: Record<string, string | number> = {}) =>
    (await http.get<ListResponse<Review>>(`/products/${productId}/reviews`, { params: { sort: '-createdAt', limit: 6, ...params } })).data,
  create: async (productId: string, body: { rating: number; comment?: string }) =>
    (await http.post<ItemResponse<Review>>(`/products/${productId}/reviews`, body)).data.data,
  update: async (id: string, body: { rating?: number; comment?: string }) => (await http.patch<ItemResponse<Review>>(`/reviews/${id}`, body)).data.data,
  remove: async (id: string) => { await http.delete(`/reviews/${id}`) },
  all: async (params: Record<string, string | number>) => (await http.get<ListResponse<Review>>('/reviews', { params })).data,
}
