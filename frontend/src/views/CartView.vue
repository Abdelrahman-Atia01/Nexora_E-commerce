<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ShoppingBag, Trash2, Tag, AlertTriangle, X } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppImage from '@/components/ui/AppImage.vue'
import QuantityStepper from '@/components/ui/QuantityStepper.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useUiStore } from '@/stores/ui'
import { errorMessage, toApiError, type ApiError } from '@/lib/errors'
import { formatMoney } from '@/lib/format'

const auth = useAuthStore()
const cart = useCartStore()
const ui = useUiStore()
const route = useRoute()

const loadError = ref<ApiError | null>(null)
const load = async () => {
  if (!auth.isCustomer) return
  loadError.value = null
  try { await cart.fetch() } catch (e) { loadError.value = toApiError(e) }
}
onMounted(load)

const run = async (fn: () => Promise<unknown>) => { try { await fn() } catch (e) { ui.error(errorMessage(e)); await load() } }
const setQty = (id: string, q: number) => run(() => cart.setQuantity(id, q))
const remove = (id: string) => run(async () => { await cart.remove(id); ui.success('Item removed') })
const clear = async () => {
  if (!(await ui.confirm({ title: 'Empty your cart?', message: 'All items will be removed from your cart.', confirmLabel: 'Empty cart', danger: true }))) return
  await run(async () => { await cart.clear(); ui.success('Cart emptied') })
}

const code = ref('')
const couponError = ref('')
const applying = ref(false)
const apply = async () => {
  couponError.value = ''
  if (!code.value.trim()) { couponError.value = 'Enter a coupon code.'; return }
  applying.value = true
  try { await cart.applyCoupon(code.value.trim()); ui.success('Coupon applied'); code.value = '' } catch (e) { couponError.value = errorMessage(e) } finally { applying.value = false }
}
// The API has no "remove coupon" endpoint, but any cart change resets the coupon — re-saving an unchanged quantity does exactly that.
const removeCoupon = () => run(async () => {
  const first = cart.items[0]
  if (first) await cart.setQuantity(first._id, first.quantity)
  ui.info('Coupon removed')
})

const stock = (i: (typeof cart.items)[number]) => i.product?.quantity ?? 0
const itemTotal = computed(() => (i: (typeof cart.items)[number]) => formatMoney(i.price * i.quantity))
const showSkeleton = computed(() => cart.loading && !cart.loaded)
</script>

<template>
  <div class="container page">
    <h1>Your cart</h1>

    <EmptyState v-if="!auth.isAuthed" title="Sign in to see your cart" message="Your cart is saved to your account so it follows you across devices." :icon="ShoppingBag">
      <BaseButton :to="{ name: 'login', query: { redirect: route.fullPath } }">Sign in</BaseButton><BaseButton variant="secondary" :to="{ name: 'register' }">Create account</BaseButton>
    </EmptyState>
    <EmptyState v-else-if="auth.isAdmin" title="Administrator accounts have no cart" message="Shopping is available to customer accounts. Sign in with a customer account to test the shopping flow." :icon="ShoppingBag"><BaseButton :to="{ name: 'admin-dashboard' }">Go to dashboard</BaseButton></EmptyState>
    <ErrorState v-else-if="loadError && !cart.loaded" :message="loadError.message" :network="loadError.isNetwork" @retry="load" />

    <div v-else-if="showSkeleton" class="layout"><div class="stack"><Skeleton v-for="n in 3" :key="n" height="110px" /></div><Skeleton height="260px" /></div>

    <EmptyState v-else-if="!cart.items.length" title="Your cart is empty" message="Looks like you haven't added anything yet." :icon="ShoppingBag"><BaseButton :to="{ name: 'products' }">Start shopping</BaseButton></EmptyState>

    <div v-else class="layout">
      <section aria-label="Cart items">
        <div class="head-row"><span class="muted">{{ cart.count }} {{ cart.count === 1 ? 'item' : 'items' }}</span><BaseButton variant="ghost" size="sm" @click="clear"><Trash2 :size="15" /> Empty cart</BaseButton></div>
        <ul class="items">
          <li v-for="i in cart.items" :key="i._id" class="item">
            <component :is="i.product ? RouterLink : 'div'" v-bind="i.product ? { to: { name: 'product', params: { id: i.product._id } } } : {}" class="img"><AppImage :src="i.product?.imageCover" :alt="i.product?.title ?? 'Unavailable product'" ratio="4 / 5" /></component>
            <div class="info">
              <div class="top">
                <div class="min">
                  <h2><RouterLink v-if="i.product" :to="{ name: 'product', params: { id: i.product._id } }">{{ i.product.title }}</RouterLink><span v-else>Product no longer available</span></h2>
                  <p v-if="i.color" class="muted meta">Colour: {{ i.color }}</p>
                  <p class="muted meta tabular">{{ formatMoney(i.price) }} each</p>
                </div>
                <strong class="tabular line">{{ itemTotal(i) }}</strong>
              </div>
              <p v-if="cart.problemFor(i)" class="problem" role="alert"><AlertTriangle :size="15" aria-hidden="true" /> {{ cart.problemFor(i) }} <template v-if="i.product && stock(i) > 0"> Lower the quantity to continue.</template><template v-else> Remove it to continue.</template></p>
              <div class="ctl">
                <QuantityStepper :model-value="i.quantity" :max="Math.max(stock(i), i.quantity)" :disabled="cart.busy || !i.product" :label="`Quantity for ${i.product?.title ?? 'item'}`" @update:model-value="(q) => i.product && stock(i) > 0 && q > stock(i) ? null : setQty(i._id, q)" />
                <BaseButton variant="ghost" size="sm" :disabled="cart.busy" @click="remove(i._id)"><X :size="15" /> Remove</BaseButton>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <aside class="summary panel" aria-labelledby="sum-h">
        <h2 id="sum-h">Order summary</h2>
        <form class="coupon" @submit.prevent="apply">
          <div class="field">
            <label for="coupon">Coupon code</label>
            <div class="row" style="gap: 8px"><input id="coupon" v-model="code" class="input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Enter code" :aria-invalid="!!couponError" aria-describedby="coupon-err" /><BaseButton type="submit" variant="secondary" :loading="applying" :disabled="cart.busy">Apply</BaseButton></div>
            <p v-if="couponError" id="coupon-err" class="err" role="alert">{{ couponError }}</p>
          </div>
        </form>
        <p v-if="cart.cart.coupon" class="applied"><Tag :size="15" aria-hidden="true" /> <strong>{{ cart.cart.coupon }}</strong> applied <button type="button" class="link-btn" :disabled="cart.busy" @click="removeCoupon">Remove</button></p>

        <dl class="lines">
          <div><dt>Subtotal</dt><dd class="tabular">{{ formatMoney(cart.cart.totalPrice) }}</dd></div>
          <div v-if="cart.discount > 0" class="disc"><dt>Discount</dt><dd class="tabular">−{{ formatMoney(cart.discount) }}</dd></div>
          <div><dt>Shipping &amp; tax</dt><dd class="muted">Confirmed at order</dd></div>
          <div class="total"><dt>Estimated total</dt><dd class="tabular">{{ formatMoney(cart.payable) }}</dd></div>
        </dl>
        <BaseButton block :to="cart.hasProblems ? undefined : { name: 'checkout' }" :disabled="cart.hasProblems || cart.busy">Proceed to checkout</BaseButton>
        <p v-if="cart.hasProblems" class="muted small">Fix the items marked above to continue.</p>
        <p class="muted small">Cash on delivery is the only payment method available. Final prices and stock are verified by the store when you place the order.</p>
        <RouterLink :to="{ name: 'products' }" class="link small">Continue shopping</RouterLink>
      </aside>
    </div>
  </div>
</template>

<style scoped>
h1 { margin-bottom: 24px; }
.layout { display: grid; gap: 32px; align-items: start; }
.head-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.items { display: flex; flex-direction: column; }
.item { display: grid; grid-template-columns: 88px 1fr; gap: 16px; padding: 20px 0; border-bottom: 1px solid var(--border); }
.img { display: block; border-radius: var(--radius-sm); overflow: hidden; align-self: start; }
.info { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.top { display: flex; justify-content: space-between; gap: 12px; }
.min { min-width: 0; }
.info h2 { font: 600 15px/1.35 var(--font-body); letter-spacing: 0; }
.info h2 a:hover { text-decoration: underline; }
.meta { font-size: 13px; }
.line { white-space: nowrap; }
.ctl { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.problem { display: flex; gap: 8px; align-items: flex-start; padding: 8px 10px; background: var(--warn-soft); color: var(--warn); border-radius: var(--radius); font-size: 13px; font-weight: 500; }
.problem svg { flex: none; margin-top: 2px; }
.summary { display: flex; flex-direction: column; gap: 16px; }
.summary h2 { font-size: 20px; }
.err { color: var(--error); font-size: 12.5px; }
.applied { display: flex; align-items: center; gap: 8px; font-size: 14px; padding: 8px 12px; background: var(--success-soft); border-radius: var(--radius); color: #17583A; }
.link-btn { margin-left: auto; border: 0; background: none; font-weight: 600; text-decoration: underline; color: inherit; padding: 4px; }
.lines { display: flex; flex-direction: column; gap: 10px; margin: 0; padding-top: 6px; border-top: 1px solid var(--border); }
.lines > div { display: flex; justify-content: space-between; gap: 12px; font-size: 14.5px; }
.lines dt { color: var(--muted); } .lines dd { margin: 0; text-align: right; }
.disc dd { color: var(--success); font-weight: 600; }
.total { padding-top: 12px; border-top: 1px solid var(--border); font-size: 18px !important; font-weight: 700; }
.total dt { color: var(--ink); }
.small { font-size: 13px; }
@media (min-width: 640px) { .item { grid-template-columns: 120px 1fr; } }
@media (min-width: 960px) { .layout { grid-template-columns: minmax(0, 1fr) 380px; gap: 56px; } .summary { position: sticky; top: 112px; } }
</style>
