<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Heart } from 'lucide-vue-next'
import AppImage from '@/components/ui/AppImage.vue'
import PriceDisplay from '@/components/ui/PriceDisplay.vue'
import RatingStars from '@/components/ui/RatingStars.vue'
import { useAuthStore } from '@/stores/auth'
import { useWishlistStore } from '@/stores/wishlist'
import { useUiStore } from '@/stores/ui'
import { discountPercent, hasDiscount } from '@/lib/format'
import { errorMessage } from '@/lib/errors'
import type { Product } from '@/types/api'

const props = defineProps<{ product: Pick<Product, '_id' | 'title' | 'price' | 'priceAfterDiscount' | 'imageCover' | 'ratingsAverage'> & Partial<Pick<Product, 'ratingsQuantity' | 'quantity'>> }>()
const auth = useAuthStore()
const wishlist = useWishlistStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()

const saved = computed(() => wishlist.has(props.product._id))
const soldOut = computed(() => props.product.quantity !== undefined && props.product.quantity <= 0)

const toggle = async () => {
  if (!auth.isAuthed) { router.push({ name: 'login', query: { redirect: route.fullPath } }); return }
  try {
    const added = await wishlist.toggle(props.product._id)
    ui.success(added ? 'Saved to your wishlist' : 'Removed from your wishlist')
  } catch (e) { ui.error(errorMessage(e)) }
}
</script>

<template>
  <article class="card">
    <div class="media">
      <RouterLink :to="{ name: 'product', params: { id: product._id } }" tabindex="-1" aria-hidden="true">
        <AppImage :src="product.imageCover" :alt="product.title" />
      </RouterLink>
      <span v-if="hasDiscount(product)" class="tag sale">−{{ discountPercent(product) }}%</span>
      <span v-else-if="soldOut" class="tag out">Sold out</span>
      <button type="button" class="heart" :aria-pressed="saved" :aria-label="saved ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`" @click="toggle">
        <Heart :size="18" :fill="saved ? 'currentColor' : 'none'" />
      </button>
    </div>
    <div class="info">
      <h3 class="title"><RouterLink :to="{ name: 'product', params: { id: product._id } }">{{ product.title }}</RouterLink></h3>
      <PriceDisplay :price="product.price" :price-after-discount="product.priceAfterDiscount" />
      <RatingStars v-if="product.ratingsQuantity" :value="product.ratingsAverage" :count="product.ratingsQuantity" :size="13" />
    </div>
  </article>
</template>

<style scoped>
.card { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.media { position: relative; border-radius: var(--radius); overflow: hidden; background: #ECEDE8; }
.media a { display: block; }
.media :deep(.app-image) { transition: transform 500ms var(--ease); }
.card:hover .media :deep(.app-image) { transform: scale(1.03); }
.tag { position: absolute; top: 10px; left: 10px; padding: 3px 8px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 700; }
.sale { background: var(--accent-ink); color: #fff; }
.out { background: var(--ink); color: #fff; }
.heart { position: absolute; top: 6px; right: 6px; width: 40px; height: 40px; display: grid; place-items: center; border: 0; border-radius: 999px; background: rgba(255,255,255,0.92); color: var(--ink); transition: color var(--t), transform 80ms; }
.heart:hover { color: var(--accent-ink); }
.heart[aria-pressed='true'] { color: var(--accent-ink); }
.info { display: flex; flex-direction: column; gap: 4px; }
.title { font: 500 14.5px/1.35 var(--font-body); letter-spacing: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.7em; }
.title a:hover { text-decoration: underline; text-underline-offset: 3px; }
</style>
