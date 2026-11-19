<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { z } from 'zod'
import { MapPin, Trash2, Plus } from 'lucide-vue-next'
import TextField from '@/components/ui/TextField.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useZodForm } from '@/composables/useZodForm'
import { accountApi } from '@/features/account/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { optionalPhone } from '@/lib/validation'
import { toApiError, type ApiError } from '@/lib/errors'
import type { Address } from '@/types/api'

const auth = useAuthStore()
const ui = useUiStore()
const list = ref<Address[]>([])
const loading = ref(true)
const error = ref<ApiError | null>(null)
const adding = ref(false)
const saving = ref(false)
const formError = ref('')

const load = async () => { loading.value = true; error.value = null; try { list.value = await accountApi.addresses() } catch (e) { error.value = toApiError(e) } finally { loading.value = false } }
onMounted(load)

const schema = z.object({ alias: z.string().trim().min(1, 'Give this address a name'), details: z.string().trim().min(1, 'Address is required'), phone: optionalPhone, city: z.string().trim().optional(), postalCode: z.string().trim().optional() })
const f = useZodForm(schema, { alias: '', details: '', phone: '', city: '', postalCode: '' })

const add = f.handleSubmit(async (v) => {
  if (saving.value) return
  saving.value = true; formError.value = ''
  try {
    list.value = await accountApi.addAddress({ alias: v.alias, details: v.details, ...(v.phone ? { phone: v.phone } : {}), ...(v.city ? { city: v.city } : {}), ...(v.postalCode ? { postalCode: v.postalCode } : {}) })
    await auth.refresh()
    f.resetForm(); adding.value = false
    ui.success('Address saved')
  } catch (e) { const err = toApiError(e); if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.message } finally { saving.value = false }
})

const remove = async (a: Address) => {
  if (!(await ui.confirm({ title: 'Delete address?', message: `“${a.alias}” will be removed from your account.`, confirmLabel: 'Delete', danger: true }))) return
  try { list.value = await accountApi.removeAddress(a._id); await auth.refresh(); ui.success('Address deleted') } catch (e) { ui.error(toApiError(e).message) }
}
</script>

<template>
  <div class="stack" style="--gap: 24px">
    <div class="spread"><h1>Addresses</h1><BaseButton v-if="!adding" size="sm" @click="adding = true"><Plus :size="16" /> Add address</BaseButton></div>

    <form v-if="adding" class="panel stack" novalidate @submit.prevent="add">
      <h2>New address</h2>
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <div class="form-grid two">
        <TextField v-bind="f.bind('alias')" label="Name" placeholder="Home, Work…" required />
        <TextField v-bind="f.bind('phone')" label="Phone" type="tel" inputmode="tel" />
        <div class="span-2"><TextField v-bind="f.bind('details')" label="Address" required autocomplete="street-address" /></div>
        <TextField v-bind="f.bind('city')" label="City" />
        <TextField v-bind="f.bind('postalCode')" label="Postal code" />
      </div>
      <div class="row-wrap"><BaseButton type="submit" :loading="saving">Save address</BaseButton><BaseButton variant="ghost" @click="adding = false; f.resetForm()">Cancel</BaseButton></div>
    </form>

    <ErrorState v-if="error" :message="error.message" :network="error.isNetwork" @retry="load" />
    <div v-else-if="loading" class="stack"><Skeleton height="88px" /><Skeleton height="88px" /></div>
    <EmptyState v-else-if="!list.length && !adding" title="No saved addresses" message="Save an address to fill in checkout faster." :icon="MapPin"><BaseButton @click="adding = true">Add your first address</BaseButton></EmptyState>
    <ul v-else class="stack addr">
      <li v-for="a in list" :key="a._id" class="panel spread">
        <div class="min"><strong>{{ a.alias }}</strong><p>{{ a.details }}<template v-if="a.city">, {{ a.city }}</template><template v-if="a.postalCode"> {{ a.postalCode }}</template></p><p v-if="a.phone" class="muted">{{ a.phone }}</p></div>
        <BaseButton variant="ghost" size="sm" :aria-label="`Delete address ${a.alias}`" @click="remove(a)"><Trash2 :size="16" /> Delete</BaseButton>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.min { min-width: 0; overflow-wrap: anywhere; }
.addr { --gap: 12px; }
</style>
