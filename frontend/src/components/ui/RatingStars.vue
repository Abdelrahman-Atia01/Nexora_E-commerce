<script setup lang="ts">
import { Star } from 'lucide-vue-next'
withDefaults(defineProps<{ value: number; count?: number; size?: number; showCount?: boolean }>(), { size: 14 })
</script>
<template>
  <div class="rating" :aria-label="count === 0 ? 'No ratings yet' : `Rated ${value.toFixed(1)} out of 5`" role="img">
    <span class="stars" aria-hidden="true">
      <Star v-for="n in 5" :key="n" :size="size" :stroke-width="1.5" :fill="n <= Math.round(value) ? 'currentColor' : 'none'" />
    </span>
    <span v-if="showCount !== false && count !== undefined" class="muted tabular txt">{{ count ? `${value.toFixed(1)} (${count})` : 'No reviews yet' }}</span>
  </div>
</template>
<style scoped>
.rating { display: inline-flex; align-items: center; gap: 6px; }
.stars { display: inline-flex; gap: 1px; color: var(--accent-ink); }
.txt { font-size: 12.5px; }
</style>
