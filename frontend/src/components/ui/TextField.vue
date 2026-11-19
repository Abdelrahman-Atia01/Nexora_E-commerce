<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Eye, EyeOff, AlertCircle } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  label: string
  type?: string
  error?: string
  hint?: string
  required?: boolean
  placeholder?: string
  autocomplete?: string
  inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email'
  disabled?: boolean
  min?: string | number
  max?: string | number
  step?: string | number
  maxlength?: number
}>(), { type: 'text' })
const emit = defineEmits<{ 'update:modelValue': [value: string]; blur: [e: FocusEvent] }>()

const id = useId()
const show = ref(false)
const isPassword = computed(() => props.type === 'password')
const realType = computed(() => (isPassword.value && show.value ? 'text' : props.type))
const describedBy = computed(() => [props.error && `${id}-err`, props.hint && `${id}-hint`].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}<span v-if="required" class="req" aria-hidden="true">*</span></label>
    <div style="position: relative">
      <input
        :id="id" class="input" :type="realType" :value="modelValue ?? ''" :placeholder="placeholder"
        :autocomplete="autocomplete" :inputmode="inputmode" :disabled="disabled" :required="required"
        :min="min" :max="max" :step="step" :maxlength="maxlength"
        :aria-invalid="!!error" :aria-describedby="describedBy" :style="isPassword ? 'padding-right: 48px' : undefined"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur', $event)"
      />
      <button
        v-if="isPassword" type="button" class="icon-btn" style="position: absolute; right: 0; top: 0; height: 44px"
        :aria-label="show ? 'Hide password' : 'Show password'" :aria-pressed="show" @click="show = !show"
      >
        <EyeOff v-if="show" :size="18" /><Eye v-else :size="18" />
      </button>
    </div>
    <p v-if="hint && !error" :id="`${id}-hint`" class="hint">{{ hint }}</p>
    <p v-if="error" :id="`${id}-err`" class="err" role="alert"><AlertCircle :size="14" style="flex: none; margin-top: 2px" aria-hidden="true" />{{ error }}</p>
  </div>
</template>
