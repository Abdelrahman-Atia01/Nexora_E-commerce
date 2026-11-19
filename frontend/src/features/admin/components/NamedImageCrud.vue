<script setup lang="ts">
import { computed, ref } from 'vue'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import AdminHeader from './AdminHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TextField from '@/components/ui/TextField.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import OverlayPanel from '@/components/ui/OverlayPanel.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import AppImage from '@/components/ui/AppImage.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useAsync } from '@/composables/useAsync'
import { useListQuery } from '@/composables/useListQuery'
import { useZodForm } from '@/composables/useZodForm'
import { useCatalogStore } from '@/stores/catalog'
import { useUiStore } from '@/stores/ui'
import { formatDate } from '@/lib/format'
import { toApiError } from '@/lib/errors'
import type { ListResponse } from '@/types/api'

interface Item { _id: string; name: string; slug: string; image?: string; createdAt?: string }
const props = defineProps<{
  singular: string
  plural: string
  minName: number
  maxName: number
  api: {
    list: (params: Record<string, string | number>) => Promise<ListResponse<Item>>
    create: (b: FormData) => Promise<Item>
    update: (id: string, b: FormData) => Promise<Item>
    remove: (id: string) => Promise<void>
  }
  deleteWarning: string
}>()

const ui = useUiStore()
const catalog = useCatalogStore()
const { keyword, page, setKeyword, setPage } = useListQuery()
const list = useAsync((s) => { void s; return props.api.list({ keyword: keyword.value, page: page.value, limit: 10, sort: 'name' }) }, [keyword, page])
const rows = computed(() => list.data.value?.data ?? [])

const open = ref(false)
const editing = ref<Item | null>(null)
const files = ref<File[]>([])
const saving = ref(false)
const formError = ref('')
const removing = ref('')

const schema = z.object({ name: z.string().trim().min(props.minName, `Use ${props.minName}–${props.maxName} characters`).max(props.maxName, `Use ${props.minName}–${props.maxName} characters`) })
const f = useZodForm(schema, { name: '' })

const openNew = () => { editing.value = null; f.resetForm({ values: { name: '' } }); files.value = []; formError.value = ''; open.value = true }
const openEdit = (i: Item) => { editing.value = i; f.resetForm({ values: { name: i.name } }); files.value = []; formError.value = ''; open.value = true }

const save = f.handleSubmit(async (v) => {
  if (saving.value) return
  saving.value = true; formError.value = ''
  try {
    const fd = new FormData()
    fd.append('name', v.name)
    if (files.value[0]) fd.append('image', files.value[0])
    if (editing.value) await props.api.update(editing.value._id, fd)
    else await props.api.create(fd)
    ui.success(`${props.singular} ${editing.value ? 'updated' : 'created'}`)
    open.value = false
    catalog.invalidate()
    await list.reload()
  } catch (e) {
    const err = toApiError(e)
    if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.message
  } finally { saving.value = false }
})

const remove = async (i: Item) => {
  if (!(await ui.confirm({ title: `Delete ${props.singular.toLowerCase()}?`, message: `“${i.name}” will be removed. ${props.deleteWarning}`, confirmLabel: 'Delete', danger: true }))) return
  removing.value = i._id
  try {
    await props.api.remove(i._id)
    ui.success(`${props.singular} deleted`)
    catalog.invalidate()
    if (rows.value.length === 1 && page.value > 1) setPage(page.value - 1)
    else await list.reload()
  } catch (e) { ui.error(toApiError(e).message) } finally { removing.value = '' }
}
</script>

<template>
  <AdminHeader :title="plural">
    <BaseButton @click="openNew"><Plus :size="16" aria-hidden="true" /> New {{ singular.toLowerCase() }}</BaseButton>
  </AdminHeader>
  <div class="bar"><SearchInput :model-value="keyword" :placeholder="`Search ${plural.toLowerCase()}`" :label="`Search ${plural.toLowerCase()}`" :loading="list.loading.value" @update:model-value="setKeyword" @submit="setKeyword" /></div>
  <ErrorState v-if="list.error.value" :message="list.error.value.message" :network="list.error.value.isNetwork" @retry="list.reload" />
  <div v-else-if="list.loading.value && !list.data.value" class="stack"><Skeleton v-for="n in 4" :key="n" height="60px" /></div>
  <EmptyState v-else-if="!rows.length" :title="keyword ? 'Nothing matches your search' : `No ${plural.toLowerCase()} yet`" :message="keyword ? 'Try a different keyword.' : `Create the first ${singular.toLowerCase()}.`">
    <BaseButton v-if="keyword" variant="secondary" @click="setKeyword('')">Clear search</BaseButton><BaseButton v-else @click="openNew">New {{ singular.toLowerCase() }}</BaseButton>
  </EmptyState>
  <template v-else>
    <div class="table-wrap"><table class="table" style="min-width: 480px">
      <thead><tr><th>{{ singular }}</th><th>Slug</th><th>Created</th><th class="actions"><span class="sr-only">Actions</span></th></tr></thead>
      <tbody><tr v-for="i in rows" :key="i._id">
        <td><div class="who"><div class="th"><AppImage :src="i.image" :alt="i.name" ratio="1 / 1" /></div><strong>{{ i.name }}</strong></div></td>
        <td class="muted">{{ i.slug }}</td><td class="muted">{{ formatDate(i.createdAt) }}</td>
        <td class="actions">
          <BaseButton variant="ghost" size="sm" :aria-label="`Edit ${i.name}`" @click="openEdit(i)"><Pencil :size="16" aria-hidden="true" /></BaseButton>
          <BaseButton variant="ghost" size="sm" :loading="removing === i._id" :aria-label="`Delete ${i.name}`" @click="remove(i)"><Trash2 :size="16" aria-hidden="true" /></BaseButton>
        </td></tr></tbody></table></div>
    <Pagination v-if="list.data.value" :page="list.data.value.pagination.page" :pages="list.data.value.pagination.pages" @change="setPage" />
  </template>

  <OverlayPanel :open="open" :title="`${editing ? 'Edit' : 'New'} ${singular.toLowerCase()}`" side="right" width="440px" @close="open = false">
    <form class="stack" novalidate @submit.prevent="save">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <TextField v-bind="f.bind('name')" label="Name" required data-autofocus />
      <ImageUpload label="Image" :existing="editing?.image ? [editing.image] : []" hint="Optional. JPEG, PNG or WebP, up to 5 MB." @update:files="(x) => (files = x)" />
      <div class="row-wrap"><BaseButton type="submit" :loading="saving">{{ editing ? 'Save changes' : `Create ${singular.toLowerCase()}` }}</BaseButton><BaseButton variant="secondary" :disabled="saving" @click="open = false">Cancel</BaseButton></div>
    </form>
  </OverlayPanel>
</template>

<style scoped>
.bar { max-width: 420px; margin-bottom: 16px; }
.who { display: flex; align-items: center; gap: 12px; } .th { width: 40px; flex: none; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); }
</style>
