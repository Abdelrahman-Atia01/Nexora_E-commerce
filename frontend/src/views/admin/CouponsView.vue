<script setup lang="ts">
import { computed, ref } from 'vue'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Ticket } from 'lucide-vue-next'
import AdminHeader from '@/features/admin/components/AdminHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TextField from '@/components/ui/TextField.vue'
import OverlayPanel from '@/components/ui/OverlayPanel.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useAsync } from '@/composables/useAsync'
import { useListQuery } from '@/composables/useListQuery'
import { useZodForm } from '@/composables/useZodForm'
import { couponsApi } from '@/features/admin/api'
import { useUiStore } from '@/stores/ui'
import { formatDate } from '@/lib/format'
import { toApiError } from '@/lib/errors'
import type { Coupon } from '@/types/api'

const ui = useUiStore()
const { keyword, page, setKeyword, setPage } = useListQuery()
const list = useAsync(() => couponsApi.list({ keyword: keyword.value, page: page.value, limit: 10, sort: 'expire' }), [keyword, page])
const rows = computed(() => list.data.value?.data ?? [])
const expired = (c: Coupon) => new Date(c.expire).getTime() <= Date.now()

const open = ref(false)
const editing = ref<Coupon | null>(null)
const saving = ref(false)
const formError = ref('')
const removing = ref('')
const toDateInput = (iso: string) => iso.slice(0, 10)
const originalExpire = ref('')

const schema = z.object({
  name: z.string().trim().min(3, 'Use 3–20 characters').max(20, 'Use 3–20 characters'),
  expire: z.string().min(1, 'Choose an expiry date'),
  discount: z.string().trim().min(1, 'Discount is required').refine((v) => Number.isFinite(Number(v)) && Number(v) >= 1 && Number(v) <= 100, 'Enter a percentage from 1 to 100'),
})
const f = useZodForm(schema, { name: '', expire: '', discount: '' })
const openNew = () => { editing.value = null; originalExpire.value = ''; f.resetForm({ values: { name: '', expire: '', discount: '' } }); formError.value = ''; open.value = true }
const openEdit = (c: Coupon) => { editing.value = c; originalExpire.value = toDateInput(c.expire); f.resetForm({ values: { name: c.name, expire: toDateInput(c.expire), discount: String(c.discount) } }); formError.value = ''; open.value = true }
const tomorrow = computed(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })

const save = f.handleSubmit(async (v) => {
  if (saving.value) return
  saving.value = true; formError.value = ''
  try {
    // End of the chosen day (UTC) so "expires on 30 Nov" works through the whole day.
    const expire = `${v.expire}T23:59:59.000Z`
    if (editing.value) {
      const body: Record<string, unknown> = { name: v.name, discount: Number(v.discount) }
      if (v.expire !== originalExpire.value) body.expire = expire // the API only accepts future dates; skip when unchanged
      await couponsApi.update(editing.value._id, body)
    } else await couponsApi.create({ name: v.name, expire, discount: Number(v.discount) })
    ui.success(`Coupon ${editing.value ? 'updated' : 'created'}`)
    open.value = false
    await list.reload()
  } catch (e) { const err = toApiError(e); if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.message } finally { saving.value = false }
})
const remove = async (c: Coupon) => {
  if (!(await ui.confirm({ title: 'Delete coupon?', message: `“${c.name}” can no longer be applied. Orders that already used it keep their discount.`, confirmLabel: 'Delete', danger: true }))) return
  removing.value = c._id
  try {
    await couponsApi.remove(c._id); ui.success('Coupon deleted')
    if (rows.value.length === 1 && page.value > 1) setPage(page.value - 1); else await list.reload()
  } catch (e) { ui.error(toApiError(e).message) } finally { removing.value = '' }
}
</script>

<template>
  <AdminHeader title="Coupons" subtitle="Percentage discounts customers can apply in their cart.">
    <BaseButton @click="openNew"><Plus :size="16" aria-hidden="true" /> New coupon</BaseButton>
  </AdminHeader>
  <div class="bar"><SearchInput :model-value="keyword" placeholder="Search coupons" label="Search coupons" :loading="list.loading.value" @update:model-value="setKeyword" @submit="setKeyword" /></div>
  <ErrorState v-if="list.error.value" :message="list.error.value.message" :network="list.error.value.isNetwork" @retry="list.reload" />
  <div v-else-if="list.loading.value && !list.data.value" class="stack"><Skeleton v-for="n in 3" :key="n" height="52px" /></div>
  <EmptyState v-else-if="!rows.length" :icon="Ticket" :title="keyword ? 'No coupons match' : 'No coupons yet'" :message="keyword ? 'Try a different keyword.' : 'Create a coupon to offer a discount.'">
    <BaseButton v-if="keyword" variant="secondary" @click="setKeyword('')">Clear search</BaseButton><BaseButton v-else @click="openNew">New coupon</BaseButton>
  </EmptyState>
  <template v-else>
    <div class="table-wrap"><table class="table" style="min-width: 520px">
      <thead><tr><th>Code</th><th class="num">Discount</th><th>Expires</th><th>Status</th><th class="actions"><span class="sr-only">Actions</span></th></tr></thead>
      <tbody><tr v-for="c in rows" :key="c._id"><td><strong class="mono">{{ c.name }}</strong></td><td class="num">{{ c.discount }}%</td><td>{{ formatDate(c.expire) }}</td>
        <td><span :class="['badge', expired(c) ? 'badge-cancelled' : 'badge-delivered']">{{ expired(c) ? 'Expired' : 'Active' }}</span></td>
        <td class="actions">
          <BaseButton variant="ghost" size="sm" :aria-label="`Edit ${c.name}`" @click="openEdit(c)"><Pencil :size="16" aria-hidden="true" /></BaseButton>
          <BaseButton variant="ghost" size="sm" :loading="removing === c._id" :aria-label="`Delete ${c.name}`" @click="remove(c)"><Trash2 :size="16" aria-hidden="true" /></BaseButton>
        </td></tr></tbody></table></div>
    <Pagination v-if="list.data.value" :page="list.data.value.pagination.page" :pages="list.data.value.pagination.pages" @change="setPage" />
  </template>

  <OverlayPanel :open="open" :title="editing ? 'Edit coupon' : 'New coupon'" side="right" width="440px" @close="open = false">
    <form class="stack" novalidate @submit.prevent="save">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <TextField v-bind="f.bind('name')" label="Code" required hint="Saved in UPPERCASE. Customers type it in the cart." data-autofocus />
      <TextField v-bind="f.bind('discount')" label="Discount (%)" required inputmode="decimal" hint="1 to 100." />
      <TextField v-bind="f.bind('expire')" label="Expires on" type="date" :min="editing ? undefined : tomorrow" required hint="The API only accepts a date in the future." />
      <div class="row-wrap"><BaseButton type="submit" :loading="saving">{{ editing ? 'Save changes' : 'Create coupon' }}</BaseButton><BaseButton variant="secondary" :disabled="saving" @click="open = false">Cancel</BaseButton></div>
    </form>
  </OverlayPanel>
</template>

<style scoped>
.bar { max-width: 420px; margin-bottom: 16px; } .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.04em; }
</style>
