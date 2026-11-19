import { http } from '@/lib/http'
import type { Cart, ItemResponse } from '@/types/api'

export const cartApi = {
  get: async () => (await http.get<ItemResponse<Cart>>('/cart')).data.data,
  add: async (productId: string, quantity = 1, color?: string) =>
    (await http.post<ItemResponse<Cart>>('/cart', { productId, quantity, ...(color ? { color } : {}) })).data.data,
  setQuantity: async (itemId: string, quantity: number) => (await http.patch<ItemResponse<Cart>>(`/cart/${itemId}`, { quantity })).data.data,
  remove: async (itemId: string) => (await http.delete<ItemResponse<Cart>>(`/cart/${itemId}`)).data.data,
  clear: async () => { await http.delete('/cart') },
  applyCoupon: async (coupon: string) => (await http.patch<ItemResponse<Cart>>('/cart/apply-coupon', { coupon })).data.data,
}
