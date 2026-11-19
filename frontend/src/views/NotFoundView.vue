<script setup lang="ts">
import { SearchX } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
</script>
<template>
  <div class="container page"><EmptyState title="Page not found" message="The page you are looking for does not exist or has moved." :icon="SearchX"><BaseButton :to="{ name: 'home' }">Back to home</BaseButton><BaseButton variant="secondary" :to="{ name: 'products' }">Browse the shop</BaseButton></EmptyState></div>
</template>
