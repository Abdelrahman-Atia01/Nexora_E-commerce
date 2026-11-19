import { defineStore } from 'pinia'
import { ref } from 'vue'
import { wishlistApi } from '@/features/wishlist/api'

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref<Set<string>>(new Set())
  const loaded = ref(false)
  const pending = ref<Set<string>>(new Set())

  const has = (id: string) => ids.value.has(id)

  const fetch = async () => {
    const list = await wishlistApi.list()
    ids.value = new Set(list.map((p) => p._id))
    loaded.value = true
  }

  /** Optimistic toggle with rollback on failure (wishlist only — never prices/stock/orders). */
  const toggle = async (id: string) => {
    if (pending.value.has(id)) return
    const wasIn = ids.value.has(id)
    const next = new Set(ids.value)
    wasIn ? next.delete(id) : next.add(id)
    ids.value = next
    pending.value = new Set(pending.value).add(id)
    try {
      const serverIds = wasIn ? await wishlistApi.remove(id) : await wishlistApi.add(id)
      ids.value = new Set(serverIds.map(String))
    } catch (e) {
      const rollback = new Set(ids.value)
      wasIn ? rollback.add(id) : rollback.delete(id)
      ids.value = rollback
      throw e
    } finally {
      const p = new Set(pending.value); p.delete(id); pending.value = p
    }
    return !wasIn
  }

  const reset = () => { ids.value = new Set(); loaded.value = false }

  return { ids, loaded, has, fetch, toggle, reset }
})
