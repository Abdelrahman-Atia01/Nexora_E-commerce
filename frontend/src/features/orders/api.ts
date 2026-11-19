import { http } from '@/lib/http'
import type { ItemResponse, ListResponse, Order, ShippingAddress } from '@/types/api'

export const ordersApi = {
  create: async (shippingAddress: ShippingAddress) => (await http.post<ItemResponse<Order>>('/orders', { shippingAddress })).data.data,
  list: async (params: Record<string, string | number>, signal?: AbortSignal) => (await http.get<ListResponse<Order>>('/orders', { params, signal })).data,
  get: async (id: string) => (await http.get<ItemResponse<Order>>(`/orders/${id}`)).data.data,
  cancel: async (id: string) => (await http.patch<ItemResponse<Order>>(`/orders/${id}/cancel`)).data.data,
  markPaid: async (id: string) => (await http.patch<ItemResponse<Order>>(`/orders/${id}/pay`)).data.data,
  markDelivered: async (id: string) => (await http.patch<ItemResponse<Order>>(`/orders/${id}/deliver`)).data.data,
}
