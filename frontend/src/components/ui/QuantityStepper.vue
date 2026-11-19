<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'
const props = withDefaults(defineProps<{ modelValue: number; min?: number; max: number; disabled?: boolean; label?: string }>(), { min: 1, label: 'Quantity' })
const emit = defineEmits<{ 'update:modelValue': [v: number] }>()
const set = (v: number) => emit('update:modelValue', Math.min(props.max, Math.max(props.min, v)))
</script>
<template>
  <div class="stepper" role="group" :aria-label="label">
    <button type="button" :disabled="disabled || modelValue <= min" aria-label="Decrease quantity" @click="set(modelValue - 1)"><Minus :size="16" /></button>
    <input :value="modelValue" type="number" inputmode="numeric" :min="min" :max="max" :disabled="disabled" :aria-label="label" @change="set(parseInt(($event.target as HTMLInputElement).value, 10) || min)" />
    <button type="button" :disabled="disabled || modelValue >= max" aria-label="Increase quantity" @click="set(modelValue + 1)"><Plus :size="16" /></button>
  </div>
</template>
<style scoped>
.stepper { display: inline-flex; align-items: stretch; border: 1px solid #BFC6C0; border-radius: var(--radius); background: var(--surface); height: 44px; overflow: hidden; }
button { width: 40px; border: 0; background: transparent; display: grid; place-items: center; }
button:hover:not(:disabled) { background: #F0F1ED; }
button:disabled { opacity: 0.35; cursor: not-allowed; }
input { width: 44px; border: 0; text-align: center; font-weight: 600; background: transparent; -moz-appearance: textfield; appearance: textfield; }
input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
input:focus-visible { outline-offset: -2px; }
</style>
