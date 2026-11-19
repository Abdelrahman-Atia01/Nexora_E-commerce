<script setup lang="ts">
import { ShieldOff } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
</script>
<template>
  <div class="container page"><EmptyState title="You don't have access to this page" message="This area is only available to administrators." :icon="ShieldOff"><BaseButton :to="{ name: 'home' }">Back to home</BaseButton></EmptyState></div>
</template>
