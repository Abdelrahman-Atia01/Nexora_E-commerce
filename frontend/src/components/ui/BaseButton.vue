<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'light' | 'outline-light'
  size?: 'md' | 'sm'
  loading?: boolean
  block?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  to?: string | { name?: string; path?: string; params?: Record<string, string>; query?: Record<string, string> }
  href?: string
}>(), { variant: 'primary', size: 'md', type: 'button' })

const cls = computed(() => ['btn', `btn-${props.variant}`, props.size === 'sm' && 'btn-sm', props.block && 'btn-block'])
const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <RouterLink v-if="to && !isDisabled" :to="to" :class="cls"><slot /></RouterLink>
  <a v-else-if="href && !isDisabled" :href="href" :class="cls"><slot /></a>
  <button v-else :type="type" :class="cls" :disabled="isDisabled" :aria-busy="loading || undefined">
    <Loader2 v-if="loading" :size="16" class="spin" aria-hidden="true" />
    <slot />
  </button>
</template>
