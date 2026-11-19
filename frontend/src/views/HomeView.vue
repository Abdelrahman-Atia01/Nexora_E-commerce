<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Banknote, PackageCheck, Undo2 } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppImage from '@/components/ui/AppImage.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PriceDisplay from '@/components/ui/PriceDisplay.vue'
import ProductGrid from '@/features/products/components/ProductGrid.vue'
import { useAsync } from '@/composables/useAsync'
import { productsApi } from '@/features/products/api'
import { useCatalogStore } from '@/stores/catalog'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { Package } from 'lucide-vue-next'

useDocumentTitle('Premium everyday style')
const catalog = useCatalogStore()

// Collections are derived from existing product data with fixed, documented rules (the API has no "featured" flag):
//   Best sellers = sort by units sold (desc), 8 items      New in = newest first, 4 items
//   On sale      = products where priceAfterDiscount > 0
const best = useAsync((signal) => productsApi.list({ sort: '-sold', limit: 8 }, signal))
const fresh = useAsync((signal) => productsApi.list({ sort: '-createdAt', limit: 4 }, signal))
const sale = useAsync((signal) => productsApi.list({ 'priceAfterDiscount[gt]': 0, sort: '-createdAt', limit: 1 }, signal))

const bestProducts = computed(() => best.data.value?.data ?? [])
const hero = computed(() => bestProducts.value.find((p) => p.imageCover && p.quantity > 0) ?? bestProducts.value[0])
const saleCount = computed(() => sale.data.value?.pagination.total ?? 0)
const saleLead = computed(() => sale.data.value?.data[0])
const noProducts = computed(() => !best.loading.value && !best.error.value && best.data.value?.pagination.total === 0)
</script>

<template>
  <section class="hero on-dark" aria-labelledby="hero-title">
    <div class="container hero-grid">
      <div class="copy">
        <p class="eyebrow light">New season</p>
        <h1 id="hero-title">Better style.<br />Higher standards.</h1>
        <p class="lead">Premium quality and timeless designs, made for your everyday journey.</p>
        <div class="row-wrap">
          <BaseButton variant="light" :to="{ name: 'products' }">Shop now <ArrowRight :size="16" /></BaseButton>
          <BaseButton v-if="saleCount" variant="outline-light" :to="{ name: 'products', query: { onSale: '1' } }">View sale</BaseButton>
        </div>
      </div>
      <RouterLink v-if="hero" :to="{ name: 'product', params: { id: hero._id } }" class="hero-media" :aria-label="`Featured: ${hero.title}`">
        <AppImage :src="hero.imageCover" :alt="hero.title" ratio="4 / 5" eager />
        <span class="cap"><span class="truncate">{{ hero.title }}</span><PriceDisplay :price="hero.price" :price-after-discount="hero.priceAfterDiscount" /></span>
      </RouterLink>
      <div v-else-if="best.loading.value" class="hero-media"><Skeleton ratio="4 / 5" /></div>
    </div>
  </section>

  <section class="container section" aria-labelledby="cats">
    <div class="section-head"><h2 id="cats">Shop by category</h2><RouterLink :to="{ name: 'products' }" class="link">View all</RouterLink></div>
    <div v-if="catalog.loading && !catalog.categories.length" class="cat-grid"><Skeleton v-for="n in 4" :key="n" ratio="4 / 3" /></div>
    <ErrorState v-else-if="catalog.error && !catalog.categories.length" :message="catalog.error" network @retry="catalog.load(true)" />
    <EmptyState v-else-if="!catalog.categories.length" title="No categories yet" message="Categories will appear here once they are added." :icon="Package" />
    <div v-else class="cat-grid">
      <RouterLink v-for="c in catalog.categories.slice(0, 8)" :key="c._id" :to="{ name: 'category', params: { id: c._id } }" class="cat">
        <AppImage :src="c.image" :alt="c.name" ratio="4 / 3" />
        <span class="cat-label">{{ c.name }}<ArrowRight :size="16" aria-hidden="true" /></span>
      </RouterLink>
    </div>
  </section>

  <section class="container section tight" aria-labelledby="best">
    <div class="section-head"><h2 id="best">Best sellers</h2><RouterLink :to="{ name: 'products', query: { sort: '-sold' } }" class="link">View all</RouterLink></div>
    <ErrorState v-if="best.error.value" :message="best.error.value.message" :network="best.error.value.isNetwork" @retry="best.reload" />
    <EmptyState v-else-if="noProducts" title="The shop is being stocked" message="No products have been published yet. Please check back soon." :icon="Package" />
    <ProductGrid v-else :products="bestProducts" :loading="best.loading.value" />
  </section>

  <section v-if="saleCount" class="promo on-dark" aria-labelledby="promo-t">
    <div class="container promo-grid">
      <div>
        <p class="eyebrow light">The sale edit</p>
        <h2 id="promo-t">{{ saleCount }} {{ saleCount === 1 ? 'piece' : 'pieces' }} at a reduced price</h2>
        <p class="lead">Prices shown are the current prices — the saving is calculated from the regular price.</p>
        <BaseButton variant="light" :to="{ name: 'products', query: { onSale: '1' } }">Shop the sale <ArrowRight :size="16" /></BaseButton>
      </div>
      <RouterLink v-if="saleLead" :to="{ name: 'product', params: { id: saleLead._id } }" class="promo-media" :aria-label="saleLead.title"><AppImage :src="saleLead.imageCover" :alt="saleLead.title" ratio="16 / 10" /></RouterLink>
    </div>
  </section>

  <section class="container section" aria-labelledby="new">
    <div class="section-head"><h2 id="new">New in</h2><RouterLink :to="{ name: 'products' }" class="link">View all</RouterLink></div>
    <ErrorState v-if="fresh.error.value" :message="fresh.error.value.message" :network="fresh.error.value.isNetwork" @retry="fresh.reload" />
    <ProductGrid v-else-if="!noProducts" :products="fresh.data.value?.data ?? []" :loading="fresh.loading.value" :skeletons="4" />
  </section>

  <section class="container trust" aria-label="Shopping information">
    <div><Banknote :size="22" aria-hidden="true" /><div><strong>Cash on delivery</strong><span>Pay when your order arrives.</span></div></div>
    <div><PackageCheck :size="22" aria-hidden="true" /><div><strong>Live stock</strong><span>Availability is checked when you order.</span></div></div>
    <div><Undo2 :size="22" aria-hidden="true" /><div><strong>Cancel while pending</strong><span>Cancel from your orders page before it is delivered.</span></div></div>
  </section>
</template>

<style scoped>
.hero { background: var(--night); color: var(--on-night); overflow: hidden; }
.hero-grid { display: grid; gap: var(--s6); padding-block: var(--s7); align-items: center; }
.eyebrow.light { color: #8FD3BD; }
.copy h1 { color: #fff; margin: 14px 0 16px; font-size: clamp(36px, 6vw, 64px); line-height: 1.02; }
.lead { color: var(--on-night-muted); font-size: 17px; max-width: 46ch; margin-bottom: 28px; }
.hero-media { position: relative; display: block; border-radius: var(--radius); overflow: hidden; max-width: 460px; width: 100%; justify-self: center; }
.cap { position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-between; gap: 12px; align-items: baseline; padding: 40px 16px 14px; background: linear-gradient(transparent, rgba(15,22,19,0.88)); color: #fff; font-size: 14px; font-weight: 600; }
.cap :deep(.now), .cap :deep(.was) { color: #fff; }
.cap :deep(.was) { opacity: 0.75; }
.cat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.cat { position: relative; display: block; border-radius: var(--radius); overflow: hidden; }
.cat :deep(.app-image) { transition: transform 500ms var(--ease); }
.cat:hover :deep(.app-image) { transform: scale(1.04); }
.cat-label { position: absolute; inset: auto 0 0 0; display: flex; justify-content: space-between; align-items: center; padding: 28px 14px 12px; color: #fff; font-weight: 700; background: linear-gradient(transparent, rgba(15,22,19,0.85)); }
.section.tight { padding-top: 0; }
.promo { background: var(--night-2); color: var(--on-night); }
.promo-grid { display: grid; gap: var(--s6); padding-block: var(--s7); align-items: center; }
.promo h2 { color: #fff; margin: 12px 0 14px; font-size: clamp(26px, 3.4vw, 40px); }
.promo-media { display: block; border-radius: var(--radius); overflow: hidden; }
.trust { display: grid; gap: 20px; padding-block: var(--s6) 0; border-top: 1px solid var(--border); margin-top: var(--s4); }
.trust > div { display: flex; gap: 14px; align-items: flex-start; }
.trust svg { color: var(--brand); flex: none; margin-top: 2px; }
.trust strong { display: block; }
.trust span { color: var(--muted); font-size: 14px; }
@media (min-width: 640px) { .cat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; } .trust { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 900px) {
  .hero-grid { grid-template-columns: 1.1fr 0.9fr; padding-block: var(--s8); }
  .promo-grid { grid-template-columns: 1fr 1fr; }
  .cat-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
</style>
