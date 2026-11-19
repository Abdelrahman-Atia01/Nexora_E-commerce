<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Layers } from 'lucide-vue-next'
import AdminHeader from '@/features/admin/components/AdminHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TextField from '@/components/ui/TextField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import OverlayPanel from '@/components/ui/OverlayPanel.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useAsync } from '@/composables/useAsync'
import { useListQuery } from '@/composables/useListQuery'
import { useZodForm } from '@/composables/useZodForm'
import { subCategoriesApi } from '@/features/categories/api'
import { useCatalogStore } from '@/stores/catalog'
import { useUiStore } from '@/stores/ui'
import { toApiError } from '@/lib/errors'
import type { SubCategory } from '@/types/api'

const ui = useUiStore()
const catalog = useCatalogStore()
onMounted(() => catalog.load())
const { keyword, page, extra, setKeyword, setPage, setExtra } = useListQuery(['category'])
const list = useAsync(() => subCategoriesApi.list({ keyword: keyword.value, page: page.value, limit: 10, sort: 'name', ...(extra.value.category ? { category: extra.value.category } : {}) }), [keyword, page, () => extra.value.category])
const rows = computed(() => list.data.value?.data ?? [])
const catOptions = computed(() => catalog.categories.map((c) => ({ value: c._id, label: c.name })))
const catLabel = (s: SubCategory) => (typeof s.category === 'object' ? s.category.name : catalog.categoryName(s.category))
const catId = (s: SubCategory) => (typeof s.category === 'object' ? s.category._id : s.category)

const open = ref(false)
const editing = ref<SubCategory | null>(null)
const saving = ref(false)
const formError = ref('')
const removing = ref('')
const schema = z.object({ name: z.string().trim().min(2, 'Use 2–32 characters').max(32, 'Use 2–32 characters'), category: z.string().min(1, 'Choose the parent category') })
const f = useZodForm(schema, { name: '', category: '' })
const openNew = () => { editing.value = null; f.resetForm({ values: { name: '', category: extra.value.category || '' } }); formError.value = ''; open.value = true }
const openEdit = (s: SubCategory) => { editing.value = s; f.resetForm({ values: { name: s.name, category: catId(s) } }); formError.value = ''; open.value = true }

const save = f.handleSubmit(async (v) => {
  if (saving.value) return
  saving.value = true; formError.value = ''
  try {
    if (editing.value) await subCategoriesApi.update(editing.value._id, v)
    else await subCategoriesApi.create(v)
    ui.success(`Subcategory ${editing.value ? 'updated' : 'created'}`)
    open.value = false
    await list.reload()
  } catch (e) { const err = toApiError(e); if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.message } finally { saving.value = false }
})
const remove = async (s: SubCategory) => {
  if (!(await ui.confirm({ title: 'Delete subcategory?', message: `“${s.name}” will be removed. A subcategory used by products cannot be deleted.`, confirmLabel: 'Delete', danger: true }))) return
  removing.value = s._id
  try {
    await subCategoriesApi.remove(s._id); ui.success('Subcategory deleted')
    if (rows.value.length === 1 && page.value > 1) setPage(page.value - 1); else await list.reload()
  } catch (e) { ui.error(toApiError(e).message) } finally { removing.value = '' }
}
</script>

<template>
  <AdminHeader title="Subcategories" subtitle="Subcategories always belong to one category.">
    <BaseButton @click="openNew"><Plus :size="16" aria-hidden="true" /> New subcategory</BaseButton>
  </AdminHeader>
  <div class="filters">
    <div class="grow"><SearchInput :model-value="keyword" placeholder="Search subcategories" label="Search subcategories" :loading="list.loading.value" @update:model-value="setKeyword" @submit="setKeyword" /></div>
    <SelectField :model-value="extra.category" label="Category" placeholder="All categories" :options="catOptions" @update:model-value="(v) => setExtra('category', v)" />
  </div>
  <ErrorState v-if="list.error.value" :message="list.error.value.message" :network="list.error.value.isNetwork" @retry="list.reload" />
  <div v-else-if="list.loading.value && !list.data.value" class="stack"><Skeleton v-for="n in 4" :key="n" height="52px" /></div>
  <EmptyState v-else-if="!rows.length" :icon="Layers" :title="keyword || extra.category ? 'No subcategories match' : 'No subcategories yet'" :message="keyword || extra.category ? 'Adjust the filters.' : 'Create categories first, then add subcategories under them.'">
    <BaseButton v-if="keyword || extra.category" variant="secondary" @click="() => { setExtra('category', ''); setKeyword('') }">Clear filters</BaseButton><BaseButton v-else @click="openNew">New subcategory</BaseButton>
  </EmptyState>
  <template v-else>
    <div class="table-wrap"><table class="table" style="min-width: 460px">
      <thead><tr><th>Name</th><th>Category</th><th class="actions"><span class="sr-only">Actions</span></th></tr></thead>
      <tbody><tr v-for="s in rows" :key="s._id"><td><strong>{{ s.name }}</strong></td><td>{{ catLabel(s) }}</td>
        <td class="actions">
          <BaseButton variant="ghost" size="sm" :aria-label="`Edit ${s.name}`" @click="openEdit(s)"><Pencil :size="16" aria-hidden="true" /></BaseButton>
          <BaseButton variant="ghost" size="sm" :loading="removing === s._id" :aria-label="`Delete ${s.name}`" @click="remove(s)"><Trash2 :size="16" aria-hidden="true" /></BaseButton>
        </td></tr></tbody></table></div>
    <Pagination v-if="list.data.value" :page="list.data.value.pagination.page" :pages="list.data.value.pagination.pages" @change="setPage" />
  </template>

  <OverlayPanel :open="open" :title="editing ? 'Edit subcategory' : 'New subcategory'" side="right" width="440px" @close="open = false">
    <form class="stack" novalidate @submit.prevent="save">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <SelectField v-bind="f.bind('category')" label="Parent category" required placeholder="Choose a category" :options="catOptions" />
      <TextField v-bind="f.bind('name')" label="Name" required data-autofocus />
      <div class="row-wrap"><BaseButton type="submit" :loading="saving">{{ editing ? 'Save changes' : 'Create subcategory' }}</BaseButton><BaseButton variant="secondary" :disabled="saving" @click="open = false">Cancel</BaseButton></div>
    </form>
  </OverlayPanel>
</template>

<style scoped>
.filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin-bottom: 16px; } .grow { flex: 1 1 260px; max-width: 420px; } .filters :deep(.field) { min-width: 200px; }
</style>
