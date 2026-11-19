<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>
<template>
  <div class="ah">
    <div><h1>{{ title }}</h1><p v-if="subtitle" class="muted">{{ subtitle }}</p></div>
    <div v-if="$slots.default" class="row-wrap"><slot /></div>
  </div>
</template>
<style scoped>
.ah { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px 24px; margin-bottom: 24px; }
h1 { font-size: 26px; } p { margin: 4px 0 0; font-size: 14px; }
</style>
