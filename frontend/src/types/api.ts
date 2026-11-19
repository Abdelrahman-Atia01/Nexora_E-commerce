// Types derived from the backend Mongoose models and controllers (not from documentation).
export interface Pagination { page: number; limit: number; total: number; pages: number }
export interface ListResponse<T> { status: string; results: number; pagination: Pagination; data: T[] }
export interface ItemResponse<T> { status: string; data: T; message?: string; token?: string }

export interface Category { _id: string; id?: string; name: string; slug: string; image?: string; createdAt?: string }
export interface Brand { _id: string; id?: string; name: string; slug: string; image?: string; createdAt?: string }
export interface SubCategory { _id: string; name: string; slug: string; category: string | { _id: string; name: string } }

export interface Product {
  _id: string
  id?: string
  title: string
  slug: string
  description: string
  quantity: number
  sold: number
  price: number
  priceAfterDiscount?: number | null
  colors: string[]
  imageCover: string
  images: string[]
  category: { _id: string; name: string; slug?: string } | string
  subcategories: ({ _id: string; name: string } | string)[]
  brand?: { _id: string; name: string; slug?: string } | string | null
  ratingsAverage: number
  ratingsQuantity: number
  createdAt?: string
  reviews?: Review[]
}

export interface Review {
  _id: string
  rating: number
  comment?: string
  user: { _id: string; userName: string; image?: string } | string
  product: string
  createdAt: string
  updatedAt?: string
}

export interface Address { _id: string; alias: string; details: string; phone?: string; city?: string; postalCode?: string }

export type Role = 'user' | 'admin'
export interface User {
  _id: string
  id?: string
  userName: string
  email: string
  confirmEmail: boolean
  gender: 'male' | 'female' | 'not specified'
  role: Role
  active: boolean
  BDD?: string
  phone?: string
  image?: string
  wishlist?: string[]
  addresses: Address[]
  createdAt?: string
}

export interface CartItem {
  _id: string
  product: { _id: string; title: string; imageCover: string; quantity: number } | null
  quantity: number
  color?: string
  price: number
}
export interface Cart {
  _id?: string
  items: CartItem[]
  totalPrice: number
  totalAfterDiscount?: number | null
  coupon?: string | null
}

export type OrderStatus = 'pending' | 'delivered' | 'cancelled'
export interface OrderItem { product: string; title: string; quantity: number; color?: string; price: number }
export interface ShippingAddress { details: string; phone: string; city?: string; postalCode?: string }
export interface Order {
  _id: string
  user: string | { _id: string; userName: string; email: string }
  items: OrderItem[]
  shippingAddress: ShippingAddress
  itemsPrice: number
  discount: number
  shippingPrice: number
  taxPrice: number
  totalPrice: number
  coupon?: string
  paymentMethod: 'cash'
  status: OrderStatus
  isPaid: boolean
  paidAt?: string
  isDelivered: boolean
  deliveredAt?: string
  cancelledAt?: string
  createdAt: string
}

export interface Coupon { _id: string; name: string; expire: string; discount: number }
export interface AuthResponse { status: string; token?: string; data: User; message?: string }
