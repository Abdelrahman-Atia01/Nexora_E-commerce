<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, useId } from 'vue'
import { ImagePlus, X } from 'lucide-vue-next'
import AppImage from './AppImage.vue'

const props = withDefaults(defineProps<{ label: string; multiple?: boolean; max?: number; existing?: string[]; hint?: string; error?: string; required?: boolean }>(), { max: 1 })
const emit = defineEmits<{ 'update:files': [files: File[]]; 'update:existing': [urls: string[]] }>()

const id = useId()
const files = ref<File[]>([])
const previews = ref<string[]>([])
const localError = ref('')
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

const revoke = () => previews.value.forEach((u) => URL.revokeObjectURL(u))
onBeforeUnmount(revoke)
watch(files, (f) => { revoke(); previews.value = f.map((x) => URL.createObjectURL(x)); emit('update:files', f) })

const kept = computed(() => (files.value.length ? [] : props.existing ?? []))

const onPick = (e: Event) => {
  const input = e.target as HTMLInputElement
  const picked = Array.from(input.files ?? [])
  input.value = ''
  localError.value = ''
  const bad = picked.find((f) => !ALLOWED.includes(f.type) || f.size > MAX_BYTES)
  if (bad) { localError.value = !ALLOWED.includes(bad.type) ? 'Only JPEG, PNG and WebP images are allowed.' : 'Each image must be 5 MB or smaller.'; return }
  const next = props.multiple ? [...files.value, ...picked] : picked.slice(0, 1)
  if (next.length > props.max) { localError.value = `You can upload up to ${props.max} image${props.max > 1 ? 's' : ''}.`; return }
  files.value = next
}
const removeNew = (i: number) => { files.value = files.value.filter((_, idx) => idx !== i) }
const removeExisting = (u: string) => emit('update:existing', (props.existing ?? []).filter((x) => x !== u))
</script>

<template>
  <div class="field">
    <span class="field-label" :id="`${id}-l`">{{ label }}<span v-if="required" class="req" aria-hidden="true">*</span></span>
    <div class="grid" role="group" :aria-labelledby="`${id}-l`">
      <div v-for="u in kept" :key="u" class="tile">
        <AppImage :src="u" :alt="`Current ${label}`" ratio="1 / 1" />
        <button v-if="multiple" type="button" class="rm" aria-label="Remove this image" @click="removeExisting(u)"><X :size="14" /></button>
      </div>
      <div v-for="(p, i) in previews" :key="p" class="tile">
        <img :src="p" :alt="`New ${label} ${i + 1}`" />
        <button type="button" class="rm" aria-label="Remove this image" @click="removeNew(i)"><X :size="14" /></button>
      </div>
      <label v-if="multiple ? files.length < max : true" class="add" :for="id"><ImagePlus :size="20" aria-hidden="true" /><span>{{ multiple ? 'Add' : files.length || kept.length ? 'Replace' : 'Upload' }}</span></label>
      <input :id="id" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" :multiple="multiple" @change="onPick" />
    </div>
    <p v-if="hint && !error && !localError" class="hint">{{ hint }}</p>
    <p v-if="error || localError" class="err" role="alert">{{ error || localError }}</p>
  </div>
</template>

<style scoped>
.grid { display: flex; flex-wrap: wrap; gap: 10px; }
.tile, .add { width: 88px; height: 88px; border-radius: var(--radius); overflow: hidden; position: relative; border: 1px solid var(--border); background: #fff; }
.tile img { width: 100%; height: 100%; object-fit: cover; }
.rm { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border-radius: 999px; border: 0; background: rgba(15,22,19,0.8); color: #fff; display: grid; place-items: center; }
.add { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-style: dashed; border-color: #9AA39C; color: var(--muted); cursor: pointer; font-size: 12px; font-weight: 600; }
.add:hover { border-color: var(--brand); color: var(--brand); }
.grid:has(input:focus-visible) .add { outline: 2px solid var(--brand); outline-offset: 2px; }
</style>
