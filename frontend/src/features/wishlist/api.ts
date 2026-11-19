import { http } from '@/lib/http'
import type { ItemResponse, Product } from '@/types/api'

export type WishlistProduct = Pick<Product, '_id' | 'title' | 'price' | 'priceAfterDiscount' | 'imageCover' | 'ratingsAverage'>

export const wishlistApi = {
  list: async () => (await http.get<ItemResponse<WishlistProduct[]>>('/wishlist')).data.data,
  add: async (productId: string) => (await http.post<ItemResponse<string[]>>('/wishlist', { productId })).data.data,
  remove: async (productId: string) => (await http.delete<ItemResponse<string[]>>(`/wishlist/${productId}`)).data.data,
}
