<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { Heart, ShoppingBag, Truck, Banknote, PackageSearch } from 'lucide-vue-next'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PriceDisplay from '@/components/ui/PriceDisplay.vue'
import RatingStars from '@/components/ui/RatingStars.vue'
import QuantityStepper from '@/components/ui/QuantityStepper.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ProductGallery from '@/features/products/components/ProductGallery.vue'
import ProductGrid from '@/features/products/components/ProductGrid.vue'
import ReviewSection from '@/features/reviews/components/ReviewSection.vue'
import { productsApi } from '@/features/products/api'
import { useAsync } from '@/composables/useAsync'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useUiStore } from '@/stores/ui'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { errorMessage } from '@/lib/errors'
import { stockLabel, currentPrice, formatMoney } from '@/lib/format'

const props = defineProps<{ id: string }>()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const ui = useUiStore()

const { data: product, error, loading, reload } = useAsync((s) => productsApi.get(props.id, s), [() => props.id])
useDocumentTitle(() => product.value?.title)

const category = computed(() => (product.value && typeof product.value.category === 'object' ? product.value.category : null))
const brand = computed(() => (product.value && product.value.brand && typeof product.value.brand === 'object' ? product.value.brand : null))
const images = computed(() => (product.value ? [product.value.imageCover, ...(product.value.images ?? [])] : []))
const stock = computed(() => stockLabel(product.value?.quantity ?? 0))
const crumbs = computed(() => [
  { label: 'Home', to: '/' }, { label: 'Shop', to: '/products' },
  ...(category.value ? [{ label: category.value.name, to: `/categories/${category.value._id}` }] : []),
  { label: product.value?.title ?? '…' },
])

const qty = ref(1)
const color = ref('')
const colorError = ref('')
watch(product, (p) => { qty.value = 1; color.value = p && p.colors.length === 1 ? p.colors[0]! : ''; colorError.value = '' })
const isColor = (c: string) => typeof CSS !== 'undefined' && CSS.supports('color', c)

const adding = ref(false)
const addToCart = async () => {
  const p = product.value
  if (!p) return
  if (!auth.isAuthed) { router.push({ name: 'login', query: { redirect: route.fullPath } }); return }
  if (p.colors.length && !color.value) { colorError.value = 'Please choose a colour.'; return }
  adding.value = true
  try {
    await cart.add(p._id, qty.value, color.value || undefined)
    ui.success(`${qty.value} × ${p.title} added to your cart`, { label: 'View cart', to: '/cart' })
    await reload() // stock may have changed
  } catch (e) { ui.error(errorMessage(e)) } finally { adding.value = false }
}

const saved = computed(() => wishlist.has(props.id))
const toggleWish = async () => {
  if (!auth.isAuthed) { router.push({ name: 'login', query: { redirect: route.fullPath } }); return }
  try { const added = await wishlist.toggle(props.id); ui.success(added ? 'Saved to your wishlist' : 'Removed from your wishlist') } catch (e) { ui.error(errorMessage(e)) }
}

// Related products: other items from the same category (real data, newest first).
const related = useAsync(async (s) => {
  const c = category.value?._id
  if (!c) return []
  const r = await productsApi.list({ category: c, limit: 5, sort: '-createdAt' }, s)
  return r.data.filter((x) => x._id !== props.id).slice(0, 4)
}, [() => category.value?._id], { immediate: false })

const canBuy = computed(() => !!product.value && product.value.quantity > 0 && !auth.isAdmin)
const stickyLabel = computed(() => (product.value ? formatMoney(currentPrice(product.value)) : ''))
</script>

<template>
  <div class="container page">
    <Breadcrumbs :items="crumbs" />

    <ErrorState v-if="error && error.status !== 404" :message="error.message" :network="error.isNetwork" @retry="reload" />
    <EmptyState v-else-if="error" :icon="PackageSearch" title="Product not found" message="This product may have been removed."><BaseButton :to="{ name: 'products' }">Browse all products</BaseButton></EmptyState>

    <div v-else-if="loading && !product" class="pdp">
      <Skeleton ratio="4 / 5" /><div class="stack"><Skeleton width="60%" height="32px" /><Skeleton width="30%" height="24px" /><Skeleton height="90px" /><Skeleton height="48px" /></div>
    </div>

    <template v-else-if="product">
      <div class="pdp">
        <ProductGallery :images="images" :title="product.title" />

        <div class="buy">
          <p v-if="brand" class="eyebrow"><RouterLink :to="{ name: 'brand', params: { id: brand._id } }">{{ brand.name }}</RouterLink></p>
          <h1>{{ product.title }}</h1>
          <a v-if="product.ratingsQuantity" href="#reviews" class="rate-link"><RatingStars :value="product.ratingsAverage" :count="product.ratingsQuantity" :size="16" /></a>
          <PriceDisplay :price="product.price" :price-after-discount="product.priceAfterDiscount" size="lg" show-percent />
          <p class="stock"><span :class="['badge', `badge-${stock.tone}`]">{{ stock.text }}</span></p>

          <fieldset v-if="product.colors.length" class="colors">
            <legend>Colour<span v-if="color">: <strong>{{ color }}</strong></span></legend>
            <div class="swatches" role="radiogroup" aria-label="Colour">
              <button v-for="c in product.colors" :key="c" type="button" role="radio" :aria-checked="color === c" :aria-label="c" :title="c" :class="['sw', { on: color === c, text: !isColor(c) }]" @click="color = c; colorError = ''">
                <span v-if="isColor(c)" class="dot" :style="{ background: c }" /><span v-else>{{ c }}</span>
              </button>
            </div>
            <p v-if="colorError" class="err" role="alert">{{ colorError }}</p>
          </fieldset>

          <div class="actions">
            <QuantityStepper v-model="qty" :max="Math.max(product.quantity, 1)" :disabled="!canBuy" />
            <BaseButton class="grow" :loading="adding" :disabled="!canBuy" @click="addToCart"><ShoppingBag :size="18" /> {{ product.quantity <= 0 ? 'Out of stock' : auth.isAdmin ? 'Admin accounts cannot buy' : 'Add to cart' }}</BaseButton>
            <button type="button" class="wish" :aria-pressed="saved" :aria-label="saved ? 'Remove from wishlist' : 'Save to wishlist'" @click="toggleWish"><Heart :size="20" :fill="saved ? 'currentColor' : 'none'" /></button>
          </div>
          <p v-if="auth.isAdmin" class="muted small">Sign in with a customer account to test the shopping flow.</p>

          <ul class="facts">
            <li><Banknote :size="18" aria-hidden="true" /> Pay with cash on delivery</li>
            <li><Truck :size="18" aria-hidden="true" /> Shipping and taxes (if any) are confirmed when you place the order</li>
          </ul>

          <details class="desc" open>
            <summary>Description</summary>
            <p>{{ product.description }}</p>
          </details>
        </div>
      </div>

      <section id="reviews" class="block"><ReviewSection :product-id="product._id" :average="product.ratingsAverage" :count="product.ratingsQuantity" @changed="reload" /></section>

      <section v-if="(related.data.value ?? []).length" class="block" aria-labelledby="rel">
        <div class="section-head"><h2 id="rel">More from {{ category?.name }}</h2><RouterLink v-if="category" :to="{ name: 'category', params: { id: category._id } }" class="link">View all</RouterLink></div>
        <ProductGrid :products="related.data.value ?? []" :skeletons="4" />
      </section>

      <div class="sticky" aria-label="Quick purchase">
        <div><strong class="tabular">{{ stickyLabel }}</strong><span class="muted small truncate">{{ product.title }}</span></div>
        <BaseButton :loading="adding" :disabled="!canBuy" @click="addToCart">{{ product.quantity <= 0 ? 'Out of stock' : 'Add to cart' }}</BaseButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pdp { display: grid; gap: 28px; margin-top: 20px; }
.buy { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.buy h1 { font-size: clamp(26px, 3vw, 36px); }
.eyebrow a:hover { text-decoration: underline; }
.rate-link { width: fit-content; }
.stock { margin: 0; }
.colors { border: 0; margin: 0; padding: 0; min-width: 0; }
.colors legend { font-weight: 600; font-size: 13px; margin-bottom: 10px; padding: 0; }
.swatches { display: flex; flex-wrap: wrap; gap: 10px; }
.sw { min-width: 44px; height: 44px; padding: 0 12px; border-radius: 999px; border: 1px solid #BFC6C0; background: var(--surface); display: inline-grid; place-items: center; font-size: 14px; font-weight: 500; }
.sw:not(.text) { width: 44px; padding: 0; }
.sw .dot { width: 26px; height: 26px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.18); }
.sw.on { border-color: var(--ink); box-shadow: 0 0 0 2px var(--ink) inset; }
.err { color: var(--error); font-size: 12.5px; margin-top: 8px; }
.actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 4px; }
.grow { flex: 1; min-width: 160px; }
.wish { width: 44px; height: 44px; border-radius: var(--radius); border: 1px solid #BFC6C0; background: var(--surface); display: grid; place-items: center; }
.wish:hover { border-color: var(--ink); }
.wish[aria-pressed='true'] { color: var(--accent-ink); border-color: var(--accent-ink); }
.small { font-size: 13px; }
.facts { display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: var(--muted); padding: 16px 0; border-block: 1px solid var(--border); }
.facts li { display: flex; gap: 10px; align-items: flex-start; }
.facts svg { flex: none; margin-top: 2px; color: var(--brand); }
.desc summary { font: 700 15px var(--font-display); cursor: pointer; padding: 6px 0; }
.desc p { margin-top: 8px; color: #33403A; white-space: pre-line; overflow-wrap: anywhere; max-width: 60ch; }
.block { margin-top: var(--s8); }
.sticky { display: none; }
@media (max-width: 767px) {
  .sticky { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; background: var(--surface); border-top: 1px solid var(--border); padding: 10px var(--gutter) calc(10px + env(safe-area-inset-bottom)); gap: 12px; align-items: center; justify-content: space-between; }
  .sticky > div { display: flex; flex-direction: column; min-width: 0; }
  .page { padding-bottom: 96px; }
}
@media (min-width: 900px) { .pdp { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 56px; align-items: start; } .buy { position: sticky; top: 112px; } }
</style>
