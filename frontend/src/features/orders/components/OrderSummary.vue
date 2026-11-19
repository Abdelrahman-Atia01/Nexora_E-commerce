<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { formatMoney } from '@/lib/format'
import type { Order } from '@/types/api'
defineProps<{ order: Order }>()
</script>
<template>
  <div class="grid">
    <section class="panel stack">
      <h2>Items</h2>
      <ul class="items">
        <li v-for="(i, n) in order.items" :key="n">
          <span class="t"><RouterLink :to="{ name: 'product', params: { id: i.product } }" class="link-plain">{{ i.title }}</RouterLink><span class="muted"> × {{ i.quantity }}<template v-if="i.color"> · {{ i.color }}</template></span></span>
          <span class="tabular">{{ formatMoney(i.price * i.quantity) }}</span>
        </li>
      </ul>
      <dl class="tot">
        <div><dt>Subtotal</dt><dd class="tabular">{{ formatMoney(order.itemsPrice) }}</dd></div>
        <div v-if="order.discount > 0"><dt>Discount<template v-if="order.coupon"> ({{ order.coupon }})</template></dt><dd class="tabular">−{{ formatMoney(order.discount) }}</dd></div>
        <div><dt>Shipping</dt><dd class="tabular">{{ order.shippingPrice ? formatMoney(order.shippingPrice) : 'Free' }}</dd></div>
        <div v-if="order.taxPrice > 0"><dt>Tax</dt><dd class="tabular">{{ formatMoney(order.taxPrice) }}</dd></div>
        <div class="grand"><dt>Total</dt><dd class="tabular">{{ formatMoney(order.totalPrice) }}</dd></div>
      </dl>
    </section>
    <section class="panel stack">
      <h2>Delivery &amp; payment</h2>
      <address>{{ order.shippingAddress.details }}<template v-if="order.shippingAddress.city">, {{ order.shippingAddress.city }}</template><template v-if="order.shippingAddress.postalCode"> {{ order.shippingAddress.postalCode }}</template><br /><span class="muted">Phone: {{ order.shippingAddress.phone }}</span></address>
      <p><strong>Cash on delivery</strong> · <span :class="order.isPaid ? 'ok' : 'muted'">{{ order.isPaid ? 'Paid' : 'Payment due on delivery' }}</span></p>
    </section>
  </div>
</template>
<style scoped>
.grid { display: grid; gap: 16px; }
h2 { font-size: 17px; }
.items { display: flex; flex-direction: column; gap: 10px; font-size: 14.5px; }
.items li { display: flex; justify-content: space-between; gap: 16px; }
.t { min-width: 0; overflow-wrap: anywhere; }
.link-plain:hover { text-decoration: underline; }
.tot { margin: 0; display: flex; flex-direction: column; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border); }
.tot > div { display: flex; justify-content: space-between; font-size: 14.5px; } .tot dt { color: var(--muted); } .tot dd { margin: 0; }
.grand { font-weight: 700; font-size: 17px !important; padding-top: 10px; border-top: 1px solid var(--border); } .grand dt { color: var(--ink); }
address { font-style: normal; }
.ok { color: var(--success); font-weight: 600; }
@media (min-width: 1000px) { .grid { grid-template-columns: 1.4fr 1fr; align-items: start; } }
</style>
