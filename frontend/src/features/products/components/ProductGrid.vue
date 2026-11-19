<script setup lang="ts">
import ProductCard from './ProductCard.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import type { Product } from '@/types/api'
withDefaults(defineProps<{ products: Product[]; loading?: boolean; skeletons?: number; columns?: 3 | 4 }>(), { skeletons: 8, columns: 4 })
</script>
<template>
  <div class="grid" :class="`c${columns}`" :aria-busy="loading || undefined">
    <template v-if="loading && !products.length">
      <div v-for="n in skeletons" :key="n" class="sk"><Skeleton ratio="4 / 5" /><Skeleton width="80%" height="14px" /><Skeleton width="40%" height="14px" /></div>
    </template>
    <ProductCard v-for="p in products" v-else :key="p._id" :product="p" />
  </div>
</template>
<style scoped>
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 12px; }
.sk { display: flex; flex-direction: column; gap: 10px; }
@media (max-width: 379px) { .grid { grid-template-columns: 1fr; } }
@media (min-width: 640px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px 20px; } }
@media (min-width: 1100px) { .grid.c4 { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
</style>
