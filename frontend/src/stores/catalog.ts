import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoriesApi } from '@/features/categories/api'
import { brandsApi } from '@/features/brands/api'
import type { Brand, Category } from '@/types/api'

const TTL = 5 * 60 * 1000

/** Categories and brands are shared by header, home and filters, so fetch once and cache briefly. */
export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref<Category[]>([])
  const brands = ref<Brand[]>([])
  const loading = ref(false)
  const error = ref('')
  let fetchedAt = 0
  let inflight: Promise<void> | null = null

  const load = (force = false) => {
    if (!force && fetchedAt && Date.now() - fetchedAt < TTL) return Promise.resolve()
    if (inflight) return inflight
    loading.value = true
    error.value = ''
    inflight = Promise.all([categoriesApi.list(), brandsApi.list()])
      .then(([c, b]) => { categories.value = c.data; brands.value = b.data; fetchedAt = Date.now() })
      .catch((e) => { error.value = e?.message || 'Could not load categories'; })
      .finally(() => { loading.value = false; inflight = null })
    return inflight
  }

  const invalidate = () => { fetchedAt = 0 }
  const categoryName = (id: string) => categories.value.find((c) => c._id === id)?.name ?? ''
  const brandName = (id: string) => brands.value.find((b) => b._id === id)?.name ?? ''

  return { categories, brands, loading, error, load, invalidate, categoryName, brandName }
})
