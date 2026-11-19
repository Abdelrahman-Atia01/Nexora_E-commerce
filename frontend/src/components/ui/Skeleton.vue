<script setup lang="ts">
withDefaults(defineProps<{ width?: string; height?: string; ratio?: string }>(), { width: '100%', height: '16px' })
</script>
<template><div class="skeleton" aria-hidden="true" :style="{ width, height: ratio ? undefined : height, aspectRatio: ratio }" /></template>
