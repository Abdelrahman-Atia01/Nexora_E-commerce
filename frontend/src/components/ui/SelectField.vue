<script setup lang="ts">
import { computed, useId } from 'vue'
import { AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: string | null
  label: string
  options: { value: string; label: string }[]
  error?: string
  hint?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
const describedBy = computed(() => [props.error && `${id}-err`, props.hint && `${id}-hint`].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}<span v-if="required" class="req" aria-hidden="true">*</span></label>
    <select :id="id" class="select" :value="modelValue ?? ''" :disabled="disabled" :aria-invalid="!!error" :aria-describedby="describedBy" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <p v-if="hint && !error" :id="`${id}-hint`" class="hint">{{ hint }}</p>
    <p v-if="error" :id="`${id}-err`" class="err" role="alert"><AlertCircle :size="14" style="flex: none; margin-top: 2px" aria-hidden="true" />{{ error }}</p>
  </div>
</template>
