<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAsync } from '@/composables/useAsync'
import { ordersApi } from '@/features/orders/api'
import { formatDate, formatMoney } from '@/lib/format'

const props = defineProps<{ id: string }>()
const { data: order, error, loading, reload } = useAsync(() => ordersApi.get(props.id), [() => props.id])
</script>

<template>
  <div class="container page narrow">
    <ErrorState v-if="error" :message="error.status === 404 ? 'We could not find this order.' : error.message" :network="error.isNetwork" @retry="reload" />
    <Skeleton v-else-if="loading && !order" height="420px" />
    <template v-else-if="order">
      <div class="hero">
        <CheckCircle2 :size="44" :stroke-width="1.5" aria-hidden="true" />
        <h1>Thank you — your order is placed</h1>
        <p class="muted">Order <strong class="mono">#{{ order._id.slice(-8).toUpperCase() }}</strong> · {{ formatDate(order.createdAt, true) }}</p>
        <StatusBadge :status="order.status" />
      </div>

      <section class="panel stack">
        <h2>What happens next</h2>
        <p>Pay <strong>{{ formatMoney(order.totalPrice) }}</strong> in cash when the order is delivered to:</p>
        <address>{{ order.shippingAddress.details }}<template v-if="order.shippingAddress.city">, {{ order.shippingAddress.city }}</template><template v-if="order.shippingAddress.postalCode"> {{ order.shippingAddress.postalCode }}</template><br /><span class="muted">Phone: {{ order.shippingAddress.phone }}</span></address>
        <hr class="divider" />
        <ul class="items">
          <li v-for="(i, n) in order.items" :key="n"><span>{{ i.title }}<span class="muted"> × {{ i.quantity }}<template v-if="i.color"> · {{ i.color }}</template></span></span><span class="tabular">{{ formatMoney(i.price * i.quantity) }}</span></li>
        </ul>
        <dl class="tot">
          <div><dt>Subtotal</dt><dd class="tabular">{{ formatMoney(order.itemsPrice) }}</dd></div>
          <div v-if="order.discount > 0"><dt>Discount<template v-if="order.coupon"> ({{ order.coupon }})</template></dt><dd class="tabular">−{{ formatMoney(order.discount) }}</dd></div>
          <div><dt>Shipping</dt><dd class="tabular">{{ order.shippingPrice ? formatMoney(order.shippingPrice) : 'Free' }}</dd></div>
          <div v-if="order.taxPrice > 0"><dt>Tax</dt><dd class="tabular">{{ formatMoney(order.taxPrice) }}</dd></div>
          <div class="grand"><dt>Total (cash on delivery)</dt><dd class="tabular">{{ formatMoney(order.totalPrice) }}</dd></div>
        </dl>
      </section>

      <div class="row-wrap" style="margin-top: 24px">
        <BaseButton :to="{ name: 'order', params: { id: order._id } }">View order</BaseButton>
        <BaseButton variant="secondary" :to="{ name: 'products' }">Continue shopping</BaseButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.narrow { max-width: 760px; }
.hero { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 28px; }
.hero svg { color: var(--success); }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
h2 { font-size: 18px; }
address { font-style: normal; }
.items { display: flex; flex-direction: column; gap: 10px; font-size: 14.5px; }
.items li { display: flex; justify-content: space-between; gap: 16px; }
.tot { margin: 0; display: flex; flex-direction: column; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border); }
.tot > div { display: flex; justify-content: space-between; font-size: 14.5px; } .tot dt { color: var(--muted); } .tot dd { margin: 0; }
.grand { font-weight: 700; font-size: 17px !important; padding-top: 10px; border-top: 1px solid var(--border); } .grand dt { color: var(--ink); }
</style>
