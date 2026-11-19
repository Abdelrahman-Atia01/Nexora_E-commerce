<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
const props = defineProps<{ page: number; pages: number }>()
const emit = defineEmits<{ change: [page: number] }>()
const items = computed<(number | '…')[]>(() => {
  const { page, pages } = props
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const set = new Set([1, 2, pages - 1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))
  const arr = [...set].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  arr.forEach((n, i) => { if (i && n - arr[i - 1]! > 1) out.push('…'); out.push(n) })
  return out
})
</script>
<template>
  <nav v-if="pages > 1" class="pager" aria-label="Pagination">
    <button type="button" :disabled="page <= 1" aria-label="Previous page" @click="emit('change', page - 1)"><ChevronLeft :size="16" /></button>
    <template v-for="(it, i) in items" :key="`${it}-${i}`">
      <span v-if="it === '…'" class="gap" aria-hidden="true">…</span>
      <button v-else type="button" :class="{ on: it === page }" :aria-current="it === page ? 'page' : undefined" :aria-label="`Page ${it}`" @click="emit('change', it)">{{ it }}</button>
    </template>
    <button type="button" :disabled="page >= pages" aria-label="Next page" @click="emit('change', page + 1)"><ChevronRight :size="16" /></button>
  </nav>
</template>
<style scoped>
.pager { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; margin-top: 32px; }
button, .gap { min-width: 40px; height: 40px; display: inline-grid; place-items: center; border: 1px solid var(--border); background: var(--surface); border-radius: var(--radius); font-weight: 600; font-size: 14px; }
.gap { border: 0; background: transparent; color: var(--muted); }
button:hover:not(:disabled):not(.on) { border-color: var(--ink); }
button.on { background: var(--ink); color: #fff; border-color: var(--ink); }
button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
