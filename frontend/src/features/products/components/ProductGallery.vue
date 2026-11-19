<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppImage from '@/components/ui/AppImage.vue'
const props = defineProps<{ images: string[]; title: string }>()
const idx = ref(0)
const list = computed(() => props.images.filter(Boolean))
watch(list, () => (idx.value = 0))
</script>
<template>
  <div class="gallery">
    <div class="thumbs" v-if="list.length > 1" role="tablist" aria-label="Product images">
      <button v-for="(src, i) in list" :key="src + i" type="button" role="tab" :aria-selected="i === idx" :aria-label="`Show image ${i + 1} of ${list.length}`" :class="{ on: i === idx }" @click="idx = i">
        <AppImage :src="src" :alt="`${title} thumbnail ${i + 1}`" ratio="1 / 1" />
      </button>
    </div>
    <div class="main"><AppImage :src="list[idx]" :alt="`${title}${list.length > 1 ? ` — image ${idx + 1}` : ''}`" ratio="4 / 5" eager /></div>
  </div>
</template>
<style scoped>
.gallery { display: flex; flex-direction: column-reverse; gap: 12px; }
.main { border-radius: var(--radius); overflow: hidden; }
.thumbs { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 2px; }
.thumbs button { flex: none; width: 68px; padding: 0; border: 2px solid transparent; border-radius: var(--radius); background: none; overflow: hidden; opacity: 0.7; }
.thumbs button.on { border-color: var(--ink); opacity: 1; }
.thumbs button:hover { opacity: 1; }
@media (min-width: 900px) { .gallery { flex-direction: row; } .thumbs { flex-direction: column; overflow: visible; } .main { flex: 1; } }
</style>
