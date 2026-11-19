<script setup lang="ts">
import { RouterView } from 'vue-router'
import StoreHeader from './StoreHeader.vue'
import StoreFooter from './StoreFooter.vue'
</script>
<template>
  <a href="#main" class="skip">Skip to content</a>
  <StoreHeader />
  <main id="main" tabindex="-1"><RouterView /></main>
  <StoreFooter />
</template>
<style scoped>
.skip { position: absolute; left: 8px; top: -60px; background: var(--ink); color: #fff; padding: 10px 14px; border-radius: var(--radius); z-index: 300; }
.skip:focus { top: 8px; }
main { outline: none; }
</style>
