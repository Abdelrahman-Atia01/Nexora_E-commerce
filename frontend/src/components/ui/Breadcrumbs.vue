<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
defineProps<{ items: { label: string; to?: string }[] }>()
</script>
<template>
  <nav aria-label="Breadcrumb" class="crumbs">
    <ol>
      <li v-for="(it, i) in items" :key="i">
        <RouterLink v-if="it.to && i < items.length - 1" :to="it.to">{{ it.label }}</RouterLink>
        <span v-else :aria-current="i === items.length - 1 ? 'page' : undefined" class="cur">{{ it.label }}</span>
        <ChevronRight v-if="i < items.length - 1" :size="13" aria-hidden="true" />
      </li>
    </ol>
  </nav>
</template>
<style scoped>
ol { display: flex; flex-wrap: wrap; gap: 6px; font-size: 13px; color: var(--muted); }
li { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
a:hover { color: var(--ink); text-decoration: underline; }
.cur { color: var(--ink); font-weight: 500; max-width: 38ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
