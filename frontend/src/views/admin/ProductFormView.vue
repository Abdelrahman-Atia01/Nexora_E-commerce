<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-vue-next'
import AdminHeader from '@/features/admin/components/AdminHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TextField from '@/components/ui/TextField.vue'
import TextAreaField from '@/components/ui/TextAreaField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useZodForm } from '@/composables/useZodForm'
import { productsApi } from '@/features/products/api'
import { subCategoriesApi } from '@/features/categories/api'
import { useCatalogStore } from '@/stores/catalog'
import { useUiStore } from '@/stores/ui'
import { toApiError, type ApiError } from '@/lib/errors'
import type { Product, SubCategory } from '@/types/api'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const ui = useUiStore()
const catalog = useCatalogStore()
const isEdit = computed(() => !!props.id)

const num = (msg: string) => z.string().trim().min(1, msg).refine((v) => Number.isFinite(Number(v)), 'Enter a number')
const schema = z.object({
  title: z.string().trim().min(3, 'Use 3–100 characters').max(100, 'Use 3–100 characters'),
  description: z.string().trim().min(20, 'Describe the product in at least 20 characters').max(2000, 'Use at most 2000 characters'),
  price: num('Price is required').refine((v) => Number(v) >= 0, 'Price cannot be negative'),
  priceAfterDiscount: z.string().trim().refine((v) => v === '' || Number.isFinite(Number(v)), 'Enter a number'),
  quantity: num('Stock quantity is required').refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0, 'Use a whole number, 0 or more'),
  colors: z.string().trim(),
  category: z.string().min(1, 'Choose a category'),
  brand: z.string(),
}).superRefine((v, ctx) => {
  if (v.priceAfterDiscount !== '' && Number(v.priceAfterDiscount) >= Number(v.price)) ctx.addIssue({ code: 'custom', path: ['priceAfterDiscount'], message: 'Must be lower than the regular price' })
})
const f = useZodForm(schema, { title: '', description: '', price: '', priceAfterDiscount: '', quantity: '', colors: '', category: '', brand: '' })

const subOptions = ref<SubCategory[]>([])
const selectedSubs = ref<string[]>([])
const subsLoading = ref(false)
const coverFiles = ref<File[]>([])
const galleryFiles = ref<File[]>([])
const existingGallery = ref<string[]>([])
const existingCover = ref<string[]>([])
const coverError = ref('')
const loading = ref(false)
const loadError = ref<ApiError | null>(null)
const saving = ref(false)
const formError = ref('')

const category = computed(() => f.get<string>('category'))
watch(category, async (c, prev) => {
  if (prev !== undefined && c !== prev && !loading.value) selectedSubs.value = []
  subOptions.value = []
  if (!c) return
  subsLoading.value = true
  try { subOptions.value = await subCategoriesApi.byCategory(c) } catch { subOptions.value = [] } finally { subsLoading.value = false }
})

const idOf = (v: { _id: string } | string | null | undefined) => (typeof v === 'object' && v ? v._id : (v as string) ?? '')

const load = async () => {
  loading.value = true; loadError.value = null
  try {
    await catalog.load(true)
    if (!props.id) return
    const p: Product = await productsApi.get(props.id)
    selectedSubs.value = p.subcategories.map((s) => idOf(s))
    f.resetForm({ values: {
      title: p.title, description: p.description, price: String(p.price), priceAfterDiscount: p.priceAfterDiscount ? String(p.priceAfterDiscount) : '',
      quantity: String(p.quantity), colors: (p.colors ?? []).join(', '), category: idOf(p.category), brand: idOf(p.brand),
    } as never })
    existingCover.value = [p.imageCover]
    existingGallery.value = [...(p.images ?? [])]
  } catch (e) { loadError.value = toApiError(e) } finally { loading.value = false }
}
onMounted(load)

const colorList = (s: string) => [...new Set(s.split(',').map((c) => c.trim()).filter(Boolean))]
const toggleSub = (id: string) => { selectedSubs.value = selectedSubs.value.includes(id) ? selectedSubs.value.filter((x) => x !== id) : [...selectedSubs.value, id] }

const submit = f.handleSubmit(async (v) => {
  if (saving.value) return
  coverError.value = ''
  if (!isEdit.value && !coverFiles.value.length) { coverError.value = 'A cover image is required.'; return }
  saving.value = true; formError.value = ''
  try {
    const colors = colorList(v.colors)
    if (!isEdit.value) {
      const fd = new FormData()
      fd.append('title', v.title); fd.append('description', v.description); fd.append('price', v.price); fd.append('quantity', v.quantity); fd.append('category', v.category)
      if (v.priceAfterDiscount) fd.append('priceAfterDiscount', v.priceAfterDiscount)
      if (v.brand) fd.append('brand', v.brand)
      colors.forEach((c) => fd.append('colors', c))
      selectedSubs.value.forEach((s) => fd.append('subcategories', s))
      fd.append('imageCover', coverFiles.value[0]!)
      galleryFiles.value.forEach((g) => fd.append('images', g))
      await productsApi.create(fd)
      ui.success('Product created')
    } else {
      // 1) text fields as JSON (lets us clear colors / discount / subcategories); 2) images, if any, as multipart.
      const body: Record<string, unknown> = {
        title: v.title, description: v.description, price: Number(v.price), quantity: Number(v.quantity), category: v.category,
        priceAfterDiscount: v.priceAfterDiscount ? Number(v.priceAfterDiscount) : null, colors, subcategories: selectedSubs.value,
      }
      if (v.brand) body.brand = v.brand
      if (!galleryFiles.value.length) body.images = existingGallery.value
      await productsApi.update(props.id!, body)
      if (coverFiles.value.length || galleryFiles.value.length) {
        const fd = new FormData()
        if (coverFiles.value.length) fd.append('imageCover', coverFiles.value[0]!)
        galleryFiles.value.forEach((g) => fd.append('images', g))
        await productsApi.update(props.id!, fd)
      }
      ui.success('Product updated')
    }
    router.push({ name: 'admin-products' })
  } catch (e) {
    const err = toApiError(e)
    if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.message
    else formError.value = 'Please fix the highlighted fields.'
  } finally { saving.value = false }
})

const catOptions = computed(() => catalog.categories.map((c) => ({ value: c._id, label: c.name })))
const brandOptions = computed(() => catalog.brands.map((b) => ({ value: b._id, label: b.name })))
</script>

<template>
  <RouterLink :to="{ name: 'admin-products' }" class="back"><ArrowLeft :size="16" aria-hidden="true" /> Products</RouterLink>
  <AdminHeader :title="isEdit ? 'Edit product' : 'New product'" />
  <ErrorState v-if="loadError" :message="loadError.message" :network="loadError.isNetwork" @retry="load" />
  <div v-else-if="loading" class="stack"><Skeleton height="48px" /><Skeleton height="160px" /><Skeleton height="48px" /></div>
  <form v-else class="stack form" novalidate style="--gap: 20px" @submit.prevent="submit">
    <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
    <section class="panel stack">
      <h2>Details</h2>
      <TextField v-bind="f.bind('title')" label="Title" required :maxlength="100" />
      <TextAreaField v-bind="f.bind('description')" label="Description" required :rows="6" :maxlength="2000" hint="20–2000 characters." />
    </section>
    <section class="panel stack">
      <h2>Pricing &amp; stock</h2>
      <div class="form-grid two">
        <TextField v-bind="f.bind('price')" label="Price" required inputmode="decimal" hint="Regular price." />
        <TextField v-bind="f.bind('priceAfterDiscount')" label="Discounted price" inputmode="decimal" hint="Optional. Must be lower than the price. Leave empty for no discount." />
        <TextField v-bind="f.bind('quantity')" label="Stock quantity" required inputmode="numeric" />
        <TextField v-bind="f.bind('colors')" label="Colors" hint="Optional, comma separated, e.g. Black, Olive, #1C5548" />
      </div>
    </section>
    <section class="panel stack">
      <h2>Organisation</h2>
      <div class="form-grid two">
        <SelectField v-bind="f.bind('category')" label="Category" required placeholder="Choose a category" :options="catOptions" />
        <SelectField v-bind="f.bind('brand')" label="Brand" placeholder="No brand" :options="brandOptions" />
      </div>
      <fieldset v-if="category" class="subs">
        <legend>Subcategories</legend>
        <p v-if="subsLoading" class="muted small">Loading…</p>
        <p v-else-if="!subOptions.length" class="muted small">This category has no subcategories yet.</p>
        <div v-else class="row-wrap"><label v-for="s in subOptions" :key="s._id" class="check chip"><input type="checkbox" :checked="selectedSubs.includes(s._id)" @change="toggleSub(s._id)" />{{ s.name }}</label></div>
      </fieldset>
    </section>
    <section class="panel stack">
      <h2>Images</h2>
      <ImageUpload label="Cover image" :existing="existingCover" :error="coverError" :required="!isEdit" hint="JPEG, PNG or WebP, up to 5 MB." @update:files="(x) => (coverFiles = x)" />
      <ImageUpload label="Gallery" multiple :max="5" :existing="existingGallery" :hint="isEdit ? 'Up to 5 images. Uploading new gallery images replaces the current gallery.' : 'Up to 5 images.'" @update:files="(x) => (galleryFiles = x)" @update:existing="(x) => (existingGallery = x)" />
    </section>
    <div class="row-wrap actions">
      <BaseButton type="submit" :loading="saving">{{ isEdit ? 'Save changes' : 'Create product' }}</BaseButton>
      <BaseButton :to="{ name: 'admin-products' }" variant="secondary" :disabled="saving">Cancel</BaseButton>
    </div>
  </form>
</template>

<style scoped>
.back { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 14px; margin-bottom: 12px; min-height: 32px; } .back:hover { color: var(--ink); }
.form { max-width: 860px; } h2 { font-size: 17px; }
.subs { border: 0; padding: 0; margin: 0; } legend { font-size: 14px; font-weight: 600; margin-bottom: 8px; padding: 0; }
.chip { padding: 8px 12px; border: 1px solid var(--border); border-radius: 999px; background: var(--canvas); align-items: center; }
.chip:has(input:checked) { border-color: var(--brand); background: var(--brand-soft); }
.small { font-size: 13px; }
.actions { position: sticky; bottom: 0; background: linear-gradient(transparent, var(--canvas) 30%); padding: 20px 0 8px; }
</style>
