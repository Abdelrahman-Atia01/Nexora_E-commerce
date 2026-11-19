import { http } from '@/lib/http'
import type { Address, ItemResponse, ListResponse, User } from '@/types/api'

export const accountApi = {
  me: async () => (await http.get<ItemResponse<User>>('/users/me')).data.data,
  updateMe: async (body: FormData | Record<string, unknown>) => (await http.patch<ItemResponse<User>>('/users/me', body)).data.data,
  changePassword: async (currentPassword: string, newPassword: string) =>
    (await http.patch<{ token: string; message: string }>('/users/me/password', { currentPassword, newPassword })).data,
  deactivate: async () => { await http.delete('/users/me') },
  addresses: async () => (await http.get<ItemResponse<Address[]>>('/users/me/addresses')).data.data,
  addAddress: async (a: Omit<Address, '_id'>) => (await http.post<ItemResponse<Address[]>>('/users/me/addresses', a)).data.data,
  removeAddress: async (id: string) => (await http.delete<ItemResponse<Address[]>>(`/users/me/addresses/${id}`)).data.data,
}

export const usersAdminApi = {
  list: async (params: Record<string, string | number>) => (await http.get<ListResponse<User>>('/users', { params })).data,
  create: async (b: Record<string, unknown>) => (await http.post<ItemResponse<User>>('/users', b)).data.data,
  update: async (id: string, b: Record<string, unknown>) => (await http.patch<ItemResponse<User>>(`/users/${id}`, b)).data.data,
  remove: async (id: string) => { await http.delete(`/users/${id}`) },
}
