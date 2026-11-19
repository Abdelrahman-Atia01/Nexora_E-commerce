<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>
<template>
  <div class="container page auth-page">
    <div class="auth">
      <h1>{{ title }}</h1>
      <p v-if="subtitle" class="muted sub">{{ subtitle }}</p>
      <slot />
      <div v-if="$slots.footer" class="foot"><slot name="footer" /></div>
    </div>
  </div>
</template>
<style scoped>
.auth-page { display: flex; justify-content: center; padding-top: var(--s7); }
.auth { width: 100%; max-width: 440px; }
h1 { font-size: 32px; }
.sub { margin: 8px 0 24px; }
h1 + :not(.sub) { margin-top: 24px; }
.foot { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); text-align: center; font-size: 14.5px; }
</style>
