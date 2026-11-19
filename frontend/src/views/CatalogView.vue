<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SlidersHorizontal, X, PackageSearch } from 'lucide-vue-next'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import SelectField from '@/components/ui/SelectField.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import OverlayPanel from '@/components/ui/OverlayPanel.vue'
import ProductGrid from '@/features/products/components/ProductGrid.vue'
import ProductFilters from '@/features/products/components/ProductFilters.vue'
import { productsApi } from '@/features/products/api'
import { categoriesApi, subCategoriesApi } from '@/features/categories/api'
import { brandsApi } from '@/features/brands/api'
import { useAsync } from '@/composables/useAsync'
import { useCatalogStore } from '@/stores/catalog'
import { activeFilterCount, parseFilters, serializeFilters, SORT_OPTIONS, toApiParams, type CatalogFilters } from '@/lib/query'
import { formatMoney } from '@/lib/format'
import AppImage from '@/components/ui/AppImage.vue'

const props = defineProps<{ scope: 'all' | 'search' | 'category' | 'brand'; scopeId?: string }>()
const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
catalog.load()

// URL is the source of truth. For category/brand pages the path id overrides the matching filter.
const filters = computed<CatalogFilters>(() => {
  const f = parseFilters(route.query)
  if (props.scope === 'category' && props.scopeId) f.category = props.scopeId
  if (props.scope === 'brand' && props.scopeId) f.brand = props.scopeId
  return f
})
const hidden = computed(() => (props.scope === 'category' ? (['category'] as const) : props.scope === 'brand' ? (['brand'] as const) : undefined) as ('category' | 'brand')[] | undefined)

const update = (patch: Partial<CatalogFilters>, replace = false) => {
  const next = { ...filters.value, ...patch }
  const q = serializeFilters(next)
  if (props.scope === 'category') delete q.category
  if (props.scope === 'brand') delete q.brand
  const name = props.scope === 'search' && !next.q ? 'products' : props.scope === 'all' && next.q ? 'search' : undefined
  const target = name ? { name, query: q } : { query: q }
  return replace ? router.replace(target) : router.push(target)
}

const products = useAsync((signal) => productsApi.list(toApiParams(filters.value), signal), [() => route.fullPath])
const items = computed(() => products.data.value?.data ?? [])
const pagination = computed(() => products.data.value?.pagination)

watch(pagination, (p) => { if (p && p.pages > 0 && filters.value.page > p.pages) update({ page: p.pages }, true) })
const gridTop = ref<HTMLElement | null>(null)
const goPage = async (page: number) => { await update({ page }); gridTop.value?.scrollIntoView({ block: 'start' }) }

const scopeInfo = useAsync(async () => {
  if (props.scope === 'category' && props.scopeId) return categoriesApi.get(props.scopeId)
  if (props.scope === 'brand' && props.scopeId) return brandsApi.get(props.scopeId)
  return null
}, [() => props.scope, () => props.scopeId])

const subs = useAsync(async () => (filters.value.category ? subCategoriesApi.byCategory(filters.value.category) : []), [() => filters.value.category])

const title = computed(() => {
  if (props.scope === 'search') return filters.value.q ? `Results for “${filters.value.q}”` : 'Search'
  if (props.scope === 'category' || props.scope === 'brand') return scopeInfo.data.value?.name ?? (scopeInfo.error.value ? 'Not found' : 'Loading…')
  return filters.value.onSale ? 'Sale' : 'All products'
})
const crumbs = computed(() => {
  const base = [{ label: 'Home', to: '/' }]
  if (props.scope === 'all') return [...base, { label: 'Shop' }]
  if (props.scope === 'search') return [...base, { label: 'Shop', to: '/products' }, { label: 'Search' }]
  return [...base, { label: 'Shop', to: '/products' }, { label: title.value }]
})

const sidebarIgnore = computed(() => (props.scope === 'category' ? ['category' as const] : props.scope === 'brand' ? ['brand' as const] : []))
const activeCount = computed(() => activeFilterCount(filters.value, sidebarIgnore.value))

interface Chip { key: string; label: string; clear: Partial<CatalogFilters> }
const chips = computed<Chip[]>(() => {
  const f = filters.value, out: Chip[] = []
  if (f.category && props.scope !== 'category') out.push({ key: 'c', label: catalog.categoryName(f.category) || 'Category', clear: { category: '', subcategory: '', page: 1 } })
  if (f.subcategory) out.push({ key: 's', label: subs.data.value?.find((s) => s._id === f.subcategory)?.name || 'Subcategory', clear: { subcategory: '', page: 1 } })
  if (f.brand && props.scope !== 'brand') out.push({ key: 'b', label: catalog.brandName(f.brand) || 'Brand', clear: { brand: '', page: 1 } })
  if (f.min || f.max) out.push({ key: 'p', label: `${f.min ? formatMoney(Number(f.min)) : 'Any'} – ${f.max ? formatMoney(Number(f.max)) : 'Any'}`, clear: { min: '', max: '', page: 1 } })
  if (f.inStock) out.push({ key: 'i', label: 'In stock', clear: { inStock: false, page: 1 } })
  if (f.onSale) out.push({ key: 'o', label: 'On sale', clear: { onSale: false, page: 1 } })
  return out
})
const clearAll = () => update({ category: '', subcategory: '', brand: '', min: '', max: '', inStock: false, onSale: false, page: 1 })

const drawer = ref(false)
const applyDrawer = (patch: Partial<CatalogFilters>) => { drawer.value = false; update(patch) }
const clearDrawer = () => { drawer.value = false; clearAll() }

const notFound = computed(() => (props.scope === 'category' || props.scope === 'brand') && scopeInfo.error.value?.status === 404)
</script>

<template>
  <div class="container page">
    <Breadcrumbs :items="crumbs" />

    <header class="head">
      <div v-if="scope === 'brand' || scope === 'category'" class="scope-img" v-show="scopeInfo.data.value?.image"><AppImage :src="scopeInfo.data.value?.image" :alt="scopeInfo.data.value?.name ?? ''" ratio="1 / 1" /></div>
      <div class="titles">
        <h1>{{ title }}</h1>
        <p v-if="pagination && !notFound" class="muted" aria-live="polite">{{ pagination.total }} {{ pagination.total === 1 ? 'product' : 'products' }}</p>
      </div>
    </header>

    <EmptyState v-if="notFound" :title="`${scope === 'brand' ? 'Brand' : 'Category'} not found`" message="It may have been removed." :icon="PackageSearch"><BaseButton :to="{ name: 'products' }">Browse all products</BaseButton></EmptyState>

    <div v-else class="layout">
      <aside class="side" aria-label="Filters">
        <ProductFilters id-prefix="d" instant :model-value="filters" :categories="catalog.categories" :brands="catalog.brands" :subcategories="subs.data.value ?? []" :hide="hidden" @apply="update" @clear="clearAll" />
      </aside>

      <section class="results" ref="gridTop" aria-label="Products">
        <div class="toolbar">
          <div class="search-wrap"><SearchInput :model-value="filters.q" :loading="products.loading.value && !!filters.q" placeholder="Search products" @update:model-value="(v) => update({ q: v, page: 1 }, true)" @submit="(v) => update({ q: v, page: 1 })" /></div>
          <BaseButton variant="secondary" class="filter-btn" @click="drawer = true"><SlidersHorizontal :size="16" /> Filters<span v-if="activeCount" class="n">{{ activeCount }}</span></BaseButton>
          <div class="sort"><SelectField label="Sort by" :model-value="filters.sort" :options="[...SORT_OPTIONS]" @update:model-value="(v) => update({ sort: v, page: 1 })" /></div>
        </div>

        <ul v-if="chips.length" class="chips" aria-label="Active filters">
          <li v-for="c in chips" :key="c.key"><button type="button" class="chip" :aria-label="`Remove filter: ${c.label}`" @click="update(c.clear)">{{ c.label }}<X :size="14" /></button></li>
          <li><button type="button" class="btn btn-ghost btn-sm" @click="clearAll">Clear all</button></li>
        </ul>

        <ErrorState v-if="products.error.value" :message="products.error.value.message" :network="products.error.value.isNetwork" @retry="products.reload" />
        <EmptyState v-else-if="!products.loading.value && !items.length" :icon="PackageSearch" title="No products found" :message="filters.q || chips.length ? 'Try a different search or remove some filters.' : 'There are no products in this list yet.'">
          <BaseButton v-if="filters.q || chips.length" variant="secondary" @click="() => { clearAll(); update({ q: '' }) }">Clear filters</BaseButton>
        </EmptyState>
        <template v-else>
          <div :class="{ dim: products.loading.value && items.length }"><ProductGrid :products="items" :loading="products.loading.value" :skeletons="12" :columns="4" /></div>
          <Pagination v-if="pagination" :page="pagination.page" :pages="pagination.pages" @change="goPage" />
        </template>
      </section>
    </div>

    <OverlayPanel :open="drawer" title="Filters" side="left" width="360px" @close="drawer = false">
      <ProductFilters id-prefix="m" :model-value="filters" :categories="catalog.categories" :brands="catalog.brands" :subcategories="subs.data.value ?? []" :hide="hidden" @apply="applyDrawer" @clear="clearDrawer" />
    </OverlayPanel>
  </div>
</template>

<style scoped>
.head { display: flex; gap: 20px; align-items: center; margin: 18px 0 24px; }
.scope-img { width: 72px; flex: none; border-radius: var(--radius); overflow: hidden; }
.titles p { margin-top: 6px; }
.layout { display: block; }
.side { display: none; }
.toolbar { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: end; margin-bottom: 16px; }
.search-wrap { grid-column: 1 / -1; }
.sort { min-width: 0; }
.sort :deep(.field) { flex-direction: row; align-items: center; gap: 8px; }
.sort :deep(label) { white-space: nowrap; }
.filter-btn .n { background: var(--brand); color: #fff; border-radius: 999px; min-width: 20px; height: 20px; display: inline-grid; place-items: center; font-size: 11.5px; padding: 0 5px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 20px; }
.chip { display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 0 12px; border: 1px solid #BFC6C0; background: var(--surface); border-radius: 999px; font-size: 13.5px; font-weight: 500; }
.chip:hover { border-color: var(--ink); }
.dim { opacity: 0.55; transition: opacity 150ms; pointer-events: none; }
@media (min-width: 640px) { .toolbar { grid-template-columns: 1fr auto auto; } .search-wrap { grid-column: auto; } }
@media (min-width: 1024px) {
  .layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 48px; align-items: start; }
  .side { display: block; position: sticky; top: 112px; max-height: calc(100vh - 128px); overflow-y: auto; padding-right: 8px; }
  .filter-btn { display: none; }
  .toolbar { grid-template-columns: 1fr auto; }
}
</style>
