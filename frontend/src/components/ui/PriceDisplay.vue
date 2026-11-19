<script setup lang="ts">
import { computed } from 'vue'
import { currentPrice, discountPercent, formatMoney, hasDiscount } from '@/lib/format'
const props = defineProps<{ price: number; priceAfterDiscount?: number | null; size?: 'md' | 'lg'; showPercent?: boolean }>()
const p = computed(() => ({ price: props.price, priceAfterDiscount: props.priceAfterDiscount }))
</script>
<template>
  <div class="price" :class="size">
    <span class="now tabular">{{ formatMoney(currentPrice(p)) }}</span>
    <s v-if="hasDiscount(p)" class="was tabular"><span class="sr-only">Regular price </span>{{ formatMoney(price) }}</s>
    <span v-if="showPercent && hasDiscount(p)" class="off">−{{ discountPercent(p) }}%</span>
  </div>
</template>
<style scoped>
.price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 10px; }
.now { font-weight: 700; font-size: 15px; }
.was { color: var(--muted); font-size: 13px; }
.off { color: var(--accent-ink); font-weight: 700; font-size: 13px; }
.lg .now { font-size: 26px; font-family: var(--font-display); }
.lg .was { font-size: 16px; }
.lg .off { font-size: 15px; }
</style>
