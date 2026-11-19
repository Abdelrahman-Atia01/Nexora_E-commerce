<script setup lang="ts">
import { computed, ref } from 'vue'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Users } from 'lucide-vue-next'
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
import { usersAdminApi } from '@/features/account/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { formatDate } from '@/lib/format'
import { toApiError } from '@/lib/errors'
import { emailRule, optionalPhone, passwordRule, userNameRule } from '@/lib/validation'
import type { User } from '@/types/api'

const ui = useUiStore()
const auth = useAuthStore()
const { keyword, page, extra, setKeyword, setPage, setExtra } = useListQuery(['role'])
const list = useAsync(() => usersAdminApi.list({ keyword: keyword.value, page: page.value, limit: 10, sort: '-createdAt', ...(extra.value.role ? { role: extra.value.role } : {}) }), [keyword, page, () => extra.value.role])
const rows = computed(() => list.data.value?.data ?? [])
const isSelf = (u: User) => u._id === auth.user?._id

const open = ref(false)
const editing = ref<User | null>(null)
const saving = ref(false)
const formError = ref('')
const removing = ref('')

const schema = z.object({
  userName: userNameRule,
  email: z.string().trim(),
  password: z.string(),
  role: z.enum(['user', 'admin']),
  gender: z.enum(['male', 'female', 'not specified']),
  phone: optionalPhone,
  active: z.enum(['true', 'false']),
}).superRefine((v, ctx) => {
  if (!editing.value) {
    if (!emailRule.safeParse(v.email).success) ctx.addIssue({ code: 'custom', path: ['email'], message: 'Enter a valid email address' })
    const p = passwordRule.safeParse(v.password)
    if (!p.success) ctx.addIssue({ code: 'custom', path: ['password'], message: p.error.issues[0]!.message })
  }
})
const f = useZodForm(schema, { userName: '', email: '', password: '', role: 'user', gender: 'not specified', phone: '', active: 'true' })
const openNew = () => { editing.value = null; f.resetForm({ values: { userName: '', email: '', password: '', role: 'user', gender: 'not specified', phone: '', active: 'true' } }); formError.value = ''; open.value = true }
const openEdit = (u: User) => { editing.value = u; f.resetForm({ values: { userName: u.userName, email: u.email, password: '', role: u.role, gender: u.gender, phone: u.phone ?? '', active: u.active ? 'true' : 'false' } }); formError.value = ''; open.value = true }

const save = f.handleSubmit(async (v) => {
  if (saving.value) return
  saving.value = true; formError.value = ''
  try {
    if (editing.value) {
      const self = isSelf(editing.value)
      await usersAdminApi.update(editing.value._id, { userName: v.userName, gender: v.gender, ...(v.phone ? { phone: v.phone } : {}), ...(self ? {} : { role: v.role, active: v.active === 'true' }) })
      if (self) await auth.refresh()
    } else {
      await usersAdminApi.create({ userName: v.userName, email: v.email, password: v.password, role: v.role, gender: v.gender, ...(v.phone ? { phone: v.phone } : {}) })
    }
    ui.success(`User ${editing.value ? 'updated' : 'created'}`)
    open.value = false
    await list.reload()
  } catch (e) { const err = toApiError(e); if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.message } finally { saving.value = false }
})
const remove = async (u: User) => {
  if (!(await ui.confirm({ title: 'Delete user?', message: `${u.userName} (${u.email}) will be permanently deleted. To keep their order history, deactivate the account instead.`, confirmLabel: 'Delete user', danger: true }))) return
  removing.value = u._id
  try {
    await usersAdminApi.remove(u._id); ui.success('User deleted')
    if (rows.value.length === 1 && page.value > 1) setPage(page.value - 1); else await list.reload()
  } catch (e) { ui.error(toApiError(e).message) } finally { removing.value = '' }
}
const roleOptions = [{ value: 'user', label: 'Customer' }, { value: 'admin', label: 'Administrator' }]
const genderOptions = [{ value: 'not specified', label: 'Not specified' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]
</script>

<template>
  <AdminHeader title="Users" subtitle="Customer and administrator accounts.">
    <BaseButton @click="openNew"><Plus :size="16" aria-hidden="true" /> New user</BaseButton>
  </AdminHeader>
  <div class="filters">
    <div class="grow"><SearchInput :model-value="keyword" placeholder="Search by name or email" label="Search users" :loading="list.loading.value" @update:model-value="setKeyword" @submit="setKeyword" /></div>
    <SelectField :model-value="extra.role" label="Role" placeholder="All roles" :options="roleOptions" @update:model-value="(v) => setExtra('role', v)" />
  </div>
  <ErrorState v-if="list.error.value" :message="list.error.value.message" :network="list.error.value.isNetwork" @retry="list.reload" />
  <div v-else-if="list.loading.value && !list.data.value" class="stack"><Skeleton v-for="n in 4" :key="n" height="56px" /></div>
  <EmptyState v-else-if="!rows.length" :icon="Users" title="No users match" message="Adjust the search or role filter."><BaseButton variant="secondary" @click="() => { setExtra('role', ''); setKeyword('') }">Clear filters</BaseButton></EmptyState>
  <template v-else>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Email</th><th>Joined</th><th class="actions"><span class="sr-only">Actions</span></th></tr></thead>
      <tbody><tr v-for="u in rows" :key="u._id">
        <td><strong>{{ u.userName }}</strong><span v-if="isSelf(u)" class="badge badge-neutral" style="margin-left: 8px">You</span><br /><span class="muted small">{{ u.email }}</span></td>
        <td><span :class="['badge', u.role === 'admin' ? 'badge-pending' : 'badge-neutral']">{{ u.role === 'admin' ? 'Administrator' : 'Customer' }}</span></td>
        <td><span :class="['badge', u.active ? 'badge-delivered' : 'badge-cancelled']">{{ u.active ? 'Active' : 'Deactivated' }}</span></td>
        <td>{{ u.confirmEmail ? 'Confirmed' : 'Not confirmed' }}</td><td class="muted">{{ formatDate(u.createdAt) }}</td>
        <td class="actions">
          <BaseButton variant="ghost" size="sm" :aria-label="`Edit ${u.userName}`" @click="openEdit(u)"><Pencil :size="16" aria-hidden="true" /></BaseButton>
          <BaseButton v-if="!isSelf(u)" variant="ghost" size="sm" :loading="removing === u._id" :aria-label="`Delete ${u.userName}`" @click="remove(u)"><Trash2 :size="16" aria-hidden="true" /></BaseButton>
        </td></tr></tbody></table></div>
    <Pagination v-if="list.data.value" :page="list.data.value.pagination.page" :pages="list.data.value.pagination.pages" @change="setPage" />
  </template>

  <OverlayPanel :open="open" :title="editing ? 'Edit user' : 'New user'" side="right" width="460px" @close="open = false">
    <form class="stack" novalidate @submit.prevent="save">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <TextField v-bind="f.bind('userName')" label="User name" required data-autofocus />
      <TextField v-if="!editing" v-bind="f.bind('email')" label="Email" type="email" required autocomplete="off" />
      <p v-else class="muted small">Email: {{ editing.email }} (cannot be changed here)</p>
      <TextField v-if="!editing" v-bind="f.bind('password')" label="Password" type="password" required autocomplete="new-password" hint="8–64 characters with a letter and a number." />
      <div class="form-grid two">
        <SelectField v-bind="f.bind('role')" label="Role" :options="roleOptions" :disabled="!!editing && isSelf(editing)" :hint="editing && isSelf(editing) ? 'You cannot change your own role.' : undefined" />
        <SelectField v-bind="f.bind('gender')" label="Gender" :options="genderOptions" />
        <TextField v-bind="f.bind('phone')" label="Phone" type="tel" inputmode="tel" />
        <SelectField v-if="editing" v-bind="f.bind('active')" label="Account" :options="[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Deactivated' }]" :disabled="isSelf(editing)" />
      </div>
      <div class="row-wrap"><BaseButton type="submit" :loading="saving">{{ editing ? 'Save changes' : 'Create user' }}</BaseButton><BaseButton variant="secondary" :disabled="saving" @click="open = false">Cancel</BaseButton></div>
    </form>
  </OverlayPanel>
</template>

<style scoped>
.filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin-bottom: 16px; } .grow { flex: 1 1 260px; max-width: 420px; } .filters :deep(.field) { min-width: 200px; }
.small { font-size: 13px; }
</style>
