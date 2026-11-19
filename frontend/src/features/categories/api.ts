import { http } from '@/lib/http'
import type { Category, ItemResponse, ListResponse, SubCategory } from '@/types/api'

export const categoriesApi = {
  list: async (params: Record<string, string | number> = { limit: 100, sort: 'name' }) =>
    (await http.get<ListResponse<Category>>('/categories', { params })).data,
  get: async (id: string) => (await http.get<ItemResponse<Category>>(`/categories/${id}`)).data.data,
  create: async (body: FormData) => (await http.post<ItemResponse<Category>>('/categories', body)).data.data,
  update: async (id: string, body: FormData) => (await http.patch<ItemResponse<Category>>(`/categories/${id}`, body)).data.data,
  remove: async (id: string) => { await http.delete(`/categories/${id}`) },
}

export const subCategoriesApi = {
  list: async (params: Record<string, string | number> = { limit: 100, sort: 'name' }) =>
    (await http.get<ListResponse<SubCategory>>('/subcategories', { params })).data,
  byCategory: async (categoryId: string) =>
    (await http.get<ListResponse<SubCategory>>(`/categories/${categoryId}/subcategories`, { params: { limit: 100, sort: 'name' } })).data.data,
  create: async (body: { name: string; category: string }) => (await http.post<ItemResponse<SubCategory>>('/subcategories', body)).data.data,
  update: async (id: string, body: { name?: string; category?: string }) => (await http.patch<ItemResponse<SubCategory>>(`/subcategories/${id}`, body)).data.data,
  remove: async (id: string) => { await http.delete(`/subcategories/${id}`) },
}
