<script setup lang="ts">
import { ref, watch, useId } from 'vue'
import { Search, X, Loader2 } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string; loading?: boolean; debounce?: number; label?: string }>(), { placeholder: 'Search products', debounce: 300, label: 'Search' })
const emit = defineEmits<{ 'update:modelValue': [v: string]; submit: [v: string] }>()
const local = ref(props.modelValue)
const id = useId()
watch(() => props.modelValue, (v) => { if (v !== local.value) local.value = v })
const push = useDebounceFn((v: string) => emit('update:modelValue', v.trim()), props.debounce)
const onInput = (e: Event) => { local.value = (e.target as HTMLInputElement).value; push(local.value) }
const clear = () => { local.value = ''; emit('update:modelValue', ''); emit('submit', '') }
</script>
<template>
  <form class="search" role="search" @submit.prevent="emit('submit', local.trim())">
    <label :for="id" class="sr-only">{{ label }}</label>
    <Search :size="18" class="lead" aria-hidden="true" />
    <input :id="id" type="search" :value="local" :placeholder="placeholder" autocomplete="off" enterkeyhint="search" @input="onInput" />
    <Loader2 v-if="loading" :size="16" class="spin trail" aria-hidden="true" />
    <button v-else-if="local" type="button" class="clear" aria-label="Clear search" @click="clear"><X :size="16" /></button>
  </form>
</template>
<style scoped>
.search { position: relative; display: flex; align-items: center; width: 100%; }
.lead { position: absolute; left: 14px; color: var(--muted); pointer-events: none; }
input { width: 100%; min-height: 44px; padding: 0 44px 0 42px; border: 1px solid #C9CFC9; border-radius: var(--radius); background: var(--surface); }
input:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(28, 85, 72, 0.18); }
input::-webkit-search-cancel-button { display: none; }
.trail { position: absolute; right: 14px; color: var(--muted); }
.clear { position: absolute; right: 4px; width: 36px; height: 36px; display: grid; place-items: center; border: 0; background: transparent; border-radius: var(--radius); color: var(--muted); }
.clear:hover { background: #F0F1ED; }
</style>
