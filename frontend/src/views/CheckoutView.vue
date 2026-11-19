<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { z } from 'zod'
import { ShoppingBag, Banknote } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import TextField from '@/components/ui/TextField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import AppImage from '@/components/ui/AppImage.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useZodForm } from '@/composables/useZodForm'
import { ordersApi } from '@/features/orders/api'
import { accountApi } from '@/features/account/api'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useUiStore } from '@/stores/ui'
import { toApiError, type ApiError } from '@/lib/errors'
import { formatMoney } from '@/lib/format'
import { phoneRule } from '@/lib/validation'
import type { Address } from '@/types/api'

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const ui = useUiStore()

const schema = z.object({
  details: z.string().trim().min(1, 'Enter your delivery address'),
  phone: phoneRule,
  city: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  saveAddress: z.boolean().optional(),
  alias: z.string().trim().optional(),
}).superRefine((v, ctx) => {
  if (v.saveAddress && !v.alias) ctx.addIssue({ code: 'custom', path: ['alias'], message: 'Give this address a name, e.g. Home' })
})
const f = useZodForm(schema, { details: '', phone: auth.user?.phone ?? '', city: '', postalCode: '', saveAddress: false, alias: '' }, { 'shippingAddress.details': 'details', 'shippingAddress.phone': 'phone', 'shippingAddress.city': 'city', 'shippingAddress.postalCode': 'postalCode' })

const addresses = ref<Address[]>([])
const loadError = ref<ApiError | null>(null)
const loading = ref(true)
const pickedAddress = ref('')
const submitting = ref(false)
const formError = ref('')

const load = async () => {
  loading.value = true; loadError.value = null
  try {
    const [, list] = await Promise.all([cart.fetch(), accountApi.addresses()])
    addresses.value = list
  } catch (e) { loadError.value = toApiError(e) } finally { loading.value = false }
}
onMounted(load)

const choose = (id: string) => {
  pickedAddress.value = id
  const a = addresses.value.find((x) => x._id === id)
  if (!a) return
  f.set('details', a.details); f.set('phone', a.phone || (auth.user?.phone ?? '')); f.set('city', a.city ?? ''); f.set('postalCode', a.postalCode ?? ''); f.set('saveAddress', false)
}

const submit = f.handleSubmit(async (v) => {
  if (submitting.value) return // never create two orders from a double click
  if (cart.hasProblems) { formError.value = 'Some items in your cart are no longer available in the requested quantity. Please review your cart.'; return }
  submitting.value = true
  formError.value = ''
  try {
    const order = await ordersApi.create({ details: v.details, phone: v.phone, ...(v.city ? { city: v.city } : {}), ...(v.postalCode ? { postalCode: v.postalCode } : {}) })
    cart.reset()
    if (v.saveAddress && v.alias) {
      try { await accountApi.addAddress({ alias: v.alias, details: v.details, phone: v.phone, city: v.city, postalCode: v.postalCode }); await auth.refresh() } catch { ui.info('Your order was placed, but the address could not be saved to your account.') }
    }
    await router.replace({ name: 'order-confirmation', params: { id: order._id } })
  } catch (e) {
    const err = toApiError(e)
    if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.message
    if (err.status === 409 || err.status === 400) await cart.fetch().catch(() => undefined)
  } finally { submitting.value = false }
})

const saveAddress = computed({ get: () => !!f.get('saveAddress'), set: (v: boolean) => f.set('saveAddress', v) })
</script>

<template>
  <div class="container page">
    <h1>Checkout</h1>

    <EmptyState v-if="auth.isAdmin" title="Administrator accounts cannot place orders" message="Sign in with a customer account to test checkout." :icon="ShoppingBag" />
    <ErrorState v-else-if="loadError" :message="loadError.message" :network="loadError.isNetwork" @retry="load" />
    <div v-else-if="loading" class="layout"><Skeleton height="420px" /><Skeleton height="320px" /></div>
    <EmptyState v-else-if="!cart.items.length" title="Your cart is empty" message="Add something to your cart before checking out." :icon="ShoppingBag"><BaseButton :to="{ name: 'products' }">Start shopping</BaseButton></EmptyState>

    <div v-else class="layout">
      <form class="stack" style="--gap: 28px" novalidate @submit.prevent="submit">
        <section class="panel stack" aria-labelledby="ship-h">
          <h2 id="ship-h">Shipping information</h2>
          <SelectField v-if="addresses.length" label="Saved addresses" :model-value="pickedAddress" placeholder="Enter a new address" :options="addresses.map((a) => ({ value: a._id, label: `${a.alias} — ${a.details}` }))" @update:model-value="choose" />
          <div class="form-grid two">
            <div class="span-2"><TextField v-bind="f.bind('details')" label="Delivery address" required autocomplete="street-address" hint="Street, building, apartment" /></div>
            <TextField v-bind="f.bind('phone')" label="Phone" type="tel" inputmode="tel" required autocomplete="tel" />
            <TextField v-bind="f.bind('city')" label="City" autocomplete="address-level2" />
            <TextField v-bind="f.bind('postalCode')" label="Postal code" autocomplete="postal-code" />
          </div>
          <label class="check"><input v-model="saveAddress" type="checkbox" /> Save this address to my account</label>
          <TextField v-if="saveAddress" v-bind="f.bind('alias')" label="Address name" placeholder="Home, Work…" required />
        </section>

        <section class="panel stack" aria-labelledby="pay-h">
          <h2 id="pay-h">Payment</h2>
          <label class="pay-opt"><input type="radio" checked name="pay" value="cash" aria-describedby="pay-note" /> <Banknote :size="20" aria-hidden="true" /><span><strong>Cash on delivery</strong><span id="pay-note" class="muted">Pay in cash when your order arrives. This is currently the only payment method.</span></span></label>
        </section>

        <p v-if="formError" class="form-error" role="alert">{{ formError }} <RouterLink v-if="cart.hasProblems" :to="{ name: 'cart' }" class="link">Review cart</RouterLink></p>
        <BaseButton type="submit" :loading="submitting" :disabled="cart.hasProblems" class="place">Place order · {{ formatMoney(cart.payable) }}</BaseButton>
      </form>

      <aside class="panel stack summary" aria-labelledby="os-h">
        <h2 id="os-h">Order summary</h2>
        <ul class="lines">
          <li v-for="i in cart.items" :key="i._id"><div class="th"><AppImage :src="i.product?.imageCover" :alt="i.product?.title ?? 'Item'" ratio="1 / 1" /></div><div class="d"><span class="t">{{ i.product?.title ?? 'Unavailable product' }}</span><span class="muted s">Qty {{ i.quantity }}<template v-if="i.color"> · {{ i.color }}</template></span></div><span class="tabular">{{ formatMoney(i.price * i.quantity) }}</span></li>
        </ul>
        <dl class="tot">
          <div><dt>Subtotal</dt><dd class="tabular">{{ formatMoney(cart.cart.totalPrice) }}</dd></div>
          <div v-if="cart.discount > 0" class="disc"><dt>Discount ({{ cart.cart.coupon }})</dt><dd class="tabular">−{{ formatMoney(cart.discount) }}</dd></div>
          <div><dt>Shipping &amp; tax</dt><dd class="muted">Added when placed, if any</dd></div>
          <div class="grand"><dt>Total</dt><dd class="tabular">{{ formatMoney(cart.payable) }}</dd></div>
        </dl>
        <p class="muted small">The store re-checks prices and stock when you place the order; the confirmation page shows the final amounts.</p>
        <RouterLink :to="{ name: 'cart' }" class="link small">Edit cart</RouterLink>
      </aside>
    </div>
  </div>
</template>

<style scoped>
h1 { margin-bottom: 24px; }
.layout { display: grid; gap: 32px; align-items: start; }
.panel h2 { font-size: 20px; }
.pay-opt { display: flex; gap: 12px; align-items: flex-start; padding: 14px; border: 1.5px solid var(--brand); border-radius: var(--radius); background: var(--brand-soft); }
.pay-opt input { margin-top: 3px; accent-color: var(--brand); }
.pay-opt span span { display: block; font-size: 13.5px; }
.lines { display: flex; flex-direction: column; gap: 14px; }
.lines li { display: grid; grid-template-columns: 56px 1fr auto; gap: 12px; align-items: center; font-size: 14px; }
.th { width: 56px; border-radius: var(--radius-sm); overflow: hidden; }
.d { display: flex; flex-direction: column; min-width: 0; }
.t { overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-weight: 500; }
.s { font-size: 12.5px; }
.tot { margin: 0; display: flex; flex-direction: column; gap: 10px; padding-top: 14px; border-top: 1px solid var(--border); }
.tot > div { display: flex; justify-content: space-between; gap: 12px; font-size: 14.5px; }
.tot dt { color: var(--muted); } .tot dd { margin: 0; text-align: right; }
.disc dd { color: var(--success); font-weight: 600; }
.grand { padding-top: 12px; border-top: 1px solid var(--border); font-size: 18px !important; font-weight: 700; } .grand dt { color: var(--ink); }
.small { font-size: 13px; }
.place { min-height: 52px; font-size: 16px; }
@media (min-width: 960px) { .layout { grid-template-columns: minmax(0, 1fr) 400px; gap: 56px; } .summary { position: sticky; top: 112px; } }
</style>
