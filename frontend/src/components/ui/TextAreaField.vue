<script setup lang="ts">
import { computed, useId } from 'vue'
import { AlertCircle } from 'lucide-vue-next'

const props = defineProps<{ modelValue?: string | null; label: string; error?: string; hint?: string; required?: boolean; placeholder?: string; rows?: number; maxlength?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
const describedBy = computed(() => [props.error && `${id}-err`, props.hint && `${id}-hint`].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}<span v-if="required" class="req" aria-hidden="true">*</span></label>
    <textarea :id="id" class="textarea" :value="modelValue ?? ''" :rows="rows ?? 4" :placeholder="placeholder" :maxlength="maxlength" :aria-invalid="!!error" :aria-describedby="describedBy" @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)" />
    <p v-if="hint && !error" :id="`${id}-hint`" class="hint">{{ hint }}</p>
    <p v-if="error" :id="`${id}-err`" class="err" role="alert"><AlertCircle :size="14" style="flex: none; margin-top: 2px" aria-hidden="true" />{{ error }}</p>
  </div>
</template>
