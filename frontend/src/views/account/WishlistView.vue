<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Heart, ShoppingBag, X } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import AppImage from '@/components/ui/AppImage.vue'
import PriceDisplay from '@/components/ui/PriceDisplay.vue'
import RatingStars from '@/components/ui/RatingStars.vue'
import { wishlistApi, type WishlistProduct } from '@/features/wishlist/api'
import { useWishlistStore } from '@/stores/wishlist'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { errorMessage, toApiError, type ApiError } from '@/lib/errors'

const wishlist = useWishlistStore()
const cart = useCartStore()
const auth = useAuthStore()
const ui = useUiStore()
const items = ref<WishlistProduct[]>([])
const loading = ref(true)
const error = ref<ApiError | null>(null)
const moving = ref('')

const load = async () => { loading.value = true; error.value = null; try { items.value = await wishlistApi.list(); await wishlist.fetch() } catch (e) { error.value = toApiError(e) } finally { loading.value = false } }
onMounted(load)

const remove = async (p: WishlistProduct) => {
  try { await wishlist.toggle(p._id); items.value = items.value.filter((x) => x._id !== p._id); ui.success('Removed from your wishlist') } catch (e) { ui.error(errorMessage(e)) }
}
// The wishlist API does not return stock/colours, so the server validates the add; colour-variant products need the product page.
const moveToCart = async (p: WishlistProduct) => {
  moving.value = p._id
  try { await cart.add(p._id, 1); ui.success(`${p.title} added to your cart`, { label: 'View cart', to: '/cart' }) } catch (e) {
    const err = toApiError(e)
    ui.error(err.message)
  } finally { moving.value = '' }
}
const canShop = computed(() => auth.isCustomer)
</script>

<template>
  <div class="stack" style="--gap: 24px">
    <h1>Wishlist</h1>
    <ErrorState v-if="error" :message="error.message" :network="error.isNetwork" @retry="load" />
    <div v-else-if="loading" class="grid"><Skeleton v-for="n in 3" :key="n" height="130px" /></div>
    <EmptyState v-else-if="!items.length" title="Your wishlist is empty" message="Tap the heart on any product to save it for later." :icon="Heart"><BaseButton :to="{ name: 'products' }">Browse products</BaseButton></EmptyState>
    <ul v-else class="stack" style="--gap: 12px">
      <li v-for="p in items" :key="p._id" class="panel row-item">
        <RouterLink :to="{ name: 'product', params: { id: p._id } }" class="img"><AppImage :src="p.imageCover" :alt="p.title" ratio="4 / 5" /></RouterLink>
        <div class="info">
          <RouterLink :to="{ name: 'product', params: { id: p._id } }" class="t">{{ p.title }}</RouterLink>
          <PriceDisplay :price="p.price" :price-after-discount="p.priceAfterDiscount" />
          <RatingStars v-if="p.ratingsAverage" :value="p.ratingsAverage" :size="13" :show-count="false" />
          <div class="row-wrap" style="margin-top: 8px">
            <BaseButton v-if="canShop" size="sm" :loading="moving === p._id" @click="moveToCart(p)"><ShoppingBag :size="15" /> Move to cart</BaseButton>
            <BaseButton size="sm" variant="ghost" @click="remove(p)"><X :size="15" /> Remove</BaseButton>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.row-item { display: grid; grid-template-columns: 84px 1fr; gap: 16px; padding: 14px; }
.img { display: block; border-radius: var(--radius-sm); overflow: hidden; align-self: start; }
.info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.t { font-weight: 600; } .t:hover { text-decoration: underline; }
</style>
