<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ImageOff } from 'lucide-vue-next'
import { resolveImageUrl } from '@/lib/images'

const props = withDefaults(defineProps<{ src?: string | null; alt: string; ratio?: string; fit?: 'cover' | 'contain'; eager?: boolean; rounded?: boolean }>(), { ratio: '4 / 5', fit: 'cover' })
const failed = ref(false)
const loaded = ref(false)
const url = computed(() => resolveImageUrl(props.src))
watch(url, () => { failed.value = false; loaded.value = false })
</script>

<template>
  <div class="app-image" :style="{ aspectRatio: ratio, borderRadius: rounded ? '999px' : undefined }">
    <img
      v-if="url && !failed" :src="url" :alt="alt" :loading="eager ? 'eager' : 'lazy'" decoding="async"
      :style="{ objectFit: fit, opacity: loaded ? 1 : 0 }" @load="loaded = true" @error="failed = true"
    />
    <div v-if="!url || failed" class="ph" role="img" :aria-label="`${alt} (image unavailable)`"><ImageOff :size="22" aria-hidden="true" /></div>
  </div>
</template>

<style scoped>
.app-image { position: relative; width: 100%; background: #ECEDE8; overflow: hidden; border-radius: var(--radius-sm); }
img { width: 100%; height: 100%; transition: opacity 240ms var(--ease); }
.ph { position: absolute; inset: 0; display: grid; place-items: center; color: #9AA39C; background: repeating-linear-gradient(135deg, #EFF0EB 0 10px, #E8EAE4 10px 20px); }
</style>
