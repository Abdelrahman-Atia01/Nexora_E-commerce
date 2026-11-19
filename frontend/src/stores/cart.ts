import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { cartApi } from '@/features/cart/api'
import { useUiStore } from './ui'
import type { Cart, CartItem } from '@/types/api'

const empty = (): Cart => ({ items: [], totalPrice: 0, totalAfterDiscount: null, coupon: null })

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart>(empty())
  const loading = ref(false)
  const loaded = ref(false)
  const busy = ref(false) // a mutation is in flight → block further clicks to avoid stale totals

  const items = computed(() => cart.value.items)
  const count = computed(() => items.value.reduce((n, i) => n + i.quantity, 0))
  const discount = computed(() => (cart.value.coupon && cart.value.totalAfterDiscount != null ? Math.max(0, cart.value.totalPrice - cart.value.totalAfterDiscount) : 0))
  const payable = computed(() => (cart.value.totalAfterDiscount != null && cart.value.coupon ? cart.value.totalAfterDiscount : cart.value.totalPrice))

  /** Items whose product was deleted, is sold out, or has less stock than the quantity in the cart. */
  const problemFor = (i: CartItem): string | null => {
    if (!i.product) return 'This product is no longer available.'
    if (i.product.quantity <= 0) return 'Out of stock.'
    if (i.quantity > i.product.quantity) return `Only ${i.product.quantity} left in stock.`
    return null
  }
  const hasProblems = computed(() => items.value.some((i) => problemFor(i)))

  const set = (c: Cart | undefined) => { cart.value = c ? { ...empty(), ...c, items: c.items ?? [] } : empty() }

  const fetch = async () => {
    loading.value = true
    try { set(await cartApi.get()); loaded.value = true } finally { loading.value = false }
  }

  // The backend clears an applied coupon on every cart change; tell the user instead of silently dropping it.
  const mutate = async (fn: () => Promise<Cart | void>) => {
    if (busy.value) return
    const hadCoupon = !!cart.value.coupon
    busy.value = true
    try {
      const res = await fn()
      set(res ?? undefined)
      loaded.value = true
      if (hadCoupon && !cart.value.coupon && cart.value.items.length) {
        useUiStore().info('Your coupon was removed because the cart changed. Apply it again to keep the discount.')
      }
    } finally {
      busy.value = false
    }
  }

  const add = (productId: string, quantity = 1, color?: string) => mutate(() => cartApi.add(productId, quantity, color))
  const setQuantity = (itemId: string, q: number) => mutate(() => cartApi.setQuantity(itemId, q))
  const remove = (itemId: string) => mutate(() => cartApi.remove(itemId))
  const clear = () => mutate(async () => { await cartApi.clear() })
  const applyCoupon = (code: string) => mutate(() => cartApi.applyCoupon(code))

  const reset = () => { cart.value = empty(); loaded.value = false }

  return { cart, items, count, discount, payable, loading, loaded, busy, hasProblems, problemFor, fetch, add, setQuantity, remove, clear, applyCoupon, reset }
})
