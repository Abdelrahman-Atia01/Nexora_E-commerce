<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { CatalogFilters } from '@/lib/query'
import type { Brand, Category, SubCategory } from '@/types/api'

const props = defineProps<{
  modelValue: CatalogFilters
  categories: Category[]
  brands: Brand[]
  subcategories: SubCategory[]
  hide?: ('category' | 'brand')[]
  /** instant = desktop sidebar (apply on change); otherwise values are held until "Apply" (mobile drawer). */
  instant?: boolean
  idPrefix: string
}>()
const emit = defineEmits<{ apply: [f: Partial<CatalogFilters>]; clear: [] }>()

const draft = reactive({ category: '', subcategory: '', brand: '', min: '', max: '', inStock: false, onSale: false })
const sync = () => Object.assign(draft, {
  category: props.modelValue.category, subcategory: props.modelValue.subcategory, brand: props.modelValue.brand,
  min: props.modelValue.min, max: props.modelValue.max, inStock: props.modelValue.inStock, onSale: props.modelValue.onSale,
})
sync()
watch(() => props.modelValue, sync, { deep: true })

const priceError = computed(() => (draft.min !== '' && draft.max !== '' && Number(draft.min) > Number(draft.max) ? 'Minimum price must not exceed maximum.' : ''))
const push = () => { if (props.instant && !priceError.value) emit('apply', { ...draft, page: 1 }) }
const pick = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => {
  draft[k] = v
  if (k === 'category') draft.subcategory = ''
  push()
}
const apply = () => { if (!priceError.value) emit('apply', { ...draft, page: 1 }) }
const showCategory = computed(() => !props.hide?.includes('category') && props.categories.length > 0)
const showBrand = computed(() => !props.hide?.includes('brand') && props.brands.length > 0)
</script>

<template>
  <form class="filters" @submit.prevent="apply">
    <fieldset v-if="showCategory">
      <legend>Category</legend>
      <label class="radio"><input type="radio" :name="`${idPrefix}-cat`" value="" :checked="!draft.category" @change="pick('category', '')" /> All categories</label>
      <label v-for="c in categories" :key="c._id" class="radio"><input type="radio" :name="`${idPrefix}-cat`" :value="c._id" :checked="draft.category === c._id" @change="pick('category', c._id)" /> {{ c.name }}</label>
    </fieldset>

    <fieldset v-if="subcategories.length">
      <legend>Subcategory</legend>
      <label class="radio"><input type="radio" :name="`${idPrefix}-sub`" value="" :checked="!draft.subcategory" @change="pick('subcategory', '')" /> All</label>
      <label v-for="s in subcategories" :key="s._id" class="radio"><input type="radio" :name="`${idPrefix}-sub`" :value="s._id" :checked="draft.subcategory === s._id" @change="pick('subcategory', s._id)" /> {{ s.name }}</label>
    </fieldset>

    <fieldset v-if="showBrand">
      <legend>Brand</legend>
      <label class="radio"><input type="radio" :name="`${idPrefix}-brand`" value="" :checked="!draft.brand" @change="pick('brand', '')" /> All brands</label>
      <label v-for="b in brands" :key="b._id" class="radio"><input type="radio" :name="`${idPrefix}-brand`" :value="b._id" :checked="draft.brand === b._id" @change="pick('brand', b._id)" /> {{ b.name }}</label>
    </fieldset>

    <fieldset>
      <legend>Price</legend>
      <div class="price-row">
        <div class="field"><label :for="`${idPrefix}-min`" class="sr-only">Minimum price</label><input :id="`${idPrefix}-min`" class="input" inputmode="decimal" type="number" min="0" placeholder="Min" :value="draft.min" :aria-invalid="!!priceError" @input="draft.min = ($event.target as HTMLInputElement).value" @change="push" /></div>
        <span aria-hidden="true">–</span>
        <div class="field"><label :for="`${idPrefix}-max`" class="sr-only">Maximum price</label><input :id="`${idPrefix}-max`" class="input" inputmode="decimal" type="number" min="0" placeholder="Max" :value="draft.max" :aria-invalid="!!priceError" @input="draft.max = ($event.target as HTMLInputElement).value" @change="push" /></div>
      </div>
      <p class="hint muted">Filters by regular price.</p>
      <p v-if="priceError" class="err" role="alert">{{ priceError }}</p>
    </fieldset>

    <fieldset>
      <legend>Availability</legend>
      <label class="check"><input type="checkbox" :checked="draft.inStock" @change="pick('inStock', ($event.target as HTMLInputElement).checked)" /> In stock only</label>
      <label class="check"><input type="checkbox" :checked="draft.onSale" @change="pick('onSale', ($event.target as HTMLInputElement).checked)" /> On sale</label>
    </fieldset>

    <div v-if="!instant" class="row" style="gap: 12px">
      <BaseButton variant="secondary" block @click="emit('clear')">Clear all</BaseButton>
      <BaseButton type="submit" block :disabled="!!priceError">Apply</BaseButton>
    </div>
    <BaseButton v-else variant="ghost" size="sm" @click="emit('clear')">Clear all filters</BaseButton>
  </form>
</template>

<style scoped>
.filters { display: flex; flex-direction: column; gap: 24px; }
fieldset { border: 0; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
legend { font: 700 13px/1 var(--font-body); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px; padding: 0; }
.radio, .check { display: flex; align-items: center; gap: 10px; font-size: 14.5px; cursor: pointer; min-height: 28px; }
.radio input, .check input { width: 17px; height: 17px; accent-color: var(--brand); margin: 0; flex: none; }
.price-row { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; }
.hint { font-size: 12px; }
.err { font-size: 12.5px; color: var(--error); }
</style>
