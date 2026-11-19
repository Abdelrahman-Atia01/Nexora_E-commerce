<script setup lang="ts">
import { AlertTriangle, WifiOff } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'
defineProps<{ message: string; network?: boolean; retryLabel?: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <div class="err-state" role="alert">
    <WifiOff v-if="network" :size="28" :stroke-width="1.5" aria-hidden="true" /><AlertTriangle v-else :size="28" :stroke-width="1.5" aria-hidden="true" />
    <h3>{{ network ? 'Connection problem' : 'Something went wrong' }}</h3>
    <p class="muted">{{ message }}</p>
    <BaseButton variant="secondary" size="sm" @click="$emit('retry')">{{ retryLabel ?? 'Try again' }}</BaseButton>
  </div>
</template>
<style scoped>
.err-state { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 48px 16px; }
.err-state svg { color: var(--error); }
.err-state p { max-width: 460px; margin-bottom: 8px; }
</style>
