<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{ title: string; message?: string; icon?: Component }>()
</script>
<template>
  <div class="empty">
    <component :is="icon" v-if="icon" :size="30" :stroke-width="1.5" aria-hidden="true" />
    <h3>{{ title }}</h3>
    <p v-if="message" class="muted">{{ message }}</p>
    <div v-if="$slots.default" class="row-wrap" style="justify-content: center; margin-top: 8px"><slot /></div>
  </div>
</template>
<style scoped>
.empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 56px 16px; color: var(--ink); }
.empty svg { color: var(--muted-soft); margin-bottom: 4px; }
.empty p { max-width: 420px; }
</style>
