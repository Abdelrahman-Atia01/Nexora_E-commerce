<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, CheckCircle2, Wallet, XCircle } from 'lucide-vue-next'
import AdminHeader from '@/features/admin/components/AdminHeader.vue'
import OrderSummary from '@/features/orders/components/OrderSummary.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useAsync } from '@/composables/useAsync'
import { ordersApi } from '@/features/orders/api'
import { formatDate } from '@/lib/format'
import { errorMessage } from '@/lib/errors'
import { useUiStore } from '@/stores/ui'
import type { Order } from '@/types/api'

const props = defineProps<{ id: string }>()
const ui = useUiStore()
const order = useAsync(() => ordersApi.get(props.id), [() => props.id])
const busy = ref('')

const act = async (key: string, fn: () => Promise<Order>, ok: string) => {
  if (busy.value) return
  busy.value = key
  try {
    const updated = await fn()
    // keep the populated customer, the update endpoints return the bare order
    const prev = order.data.value
    order.data.value = { ...updated, user: prev && typeof prev.user === 'object' ? prev.user : updated.user }
    ui.success(ok)
  } catch (e) { ui.error(errorMessage(e)) } finally { busy.value = '' }
}
const pay = () => act('pay', () => ordersApi.markPaid(props.id), 'Order marked as paid')
const deliver = () => act('deliver', () => ordersApi.markDelivered(props.id), 'Order marked as delivered')
const cancel = async () => {
  if (!(await ui.confirm({ title: 'Cancel this order?', message: 'The reserved stock goes back to the shop. This cannot be undone.', confirmLabel: 'Cancel order', danger: true }))) return
  await act('cancel', () => ordersApi.cancel(props.id), 'Order cancelled')
}
</script>

<template>
  <RouterLink :to="{ name: 'admin-orders' }" class="back"><ArrowLeft :size="16" aria-hidden="true" /> Orders</RouterLink>
  <ErrorState v-if="order.error.value" :message="order.error.value.status === 404 ? 'This order does not exist.' : order.error.value.message" :network="order.error.value.isNetwork" @retry="order.reload" />
  <div v-else-if="!order.data.value" class="stack"><Skeleton height="48px" /><Skeleton height="260px" /></div>
  <template v-else>
    <AdminHeader :title="`Order #${order.data.value._id.slice(-8).toUpperCase()}`" :subtitle="`Placed ${formatDate(order.data.value.createdAt, true)}`">
      <StatusBadge :status="order.data.value.status" />
    </AdminHeader>
    <div class="stack" style="--gap: 16px">
      <section class="panel row-wrap" style="justify-content: space-between">
        <div class="who" v-if="typeof order.data.value.user === 'object'"><span class="muted">Customer</span><strong>{{ order.data.value.user.userName }}</strong><span class="muted">{{ order.data.value.user.email }}</span></div>
        <div class="row-wrap">
          <BaseButton v-if="!order.data.value.isPaid && order.data.value.status !== 'cancelled'" variant="secondary" :loading="busy === 'pay'" :disabled="!!busy" @click="pay"><Wallet :size="16" aria-hidden="true" /> Mark as paid</BaseButton>
          <BaseButton v-if="order.data.value.status === 'pending'" :loading="busy === 'deliver'" :disabled="!!busy" @click="deliver"><CheckCircle2 :size="16" aria-hidden="true" /> Mark as delivered</BaseButton>
          <BaseButton v-if="order.data.value.status === 'pending'" variant="danger" :loading="busy === 'cancel'" :disabled="!!busy" @click="cancel"><XCircle :size="16" aria-hidden="true" /> Cancel order</BaseButton>
          <span v-if="order.data.value.status !== 'pending' && (order.data.value.isPaid || order.data.value.status === 'cancelled')" class="muted">No further actions available.</span>
        </div>
      </section>
      <p v-if="order.data.value.deliveredAt || order.data.value.cancelledAt || order.data.value.paidAt" class="muted small">
        <template v-if="order.data.value.paidAt">Paid {{ formatDate(order.data.value.paidAt, true) }}. </template>
        <template v-if="order.data.value.deliveredAt">Delivered {{ formatDate(order.data.value.deliveredAt, true) }}. </template>
        <template v-if="order.data.value.cancelledAt">Cancelled {{ formatDate(order.data.value.cancelledAt, true) }}.</template>
      </p>
      <OrderSummary :order="order.data.value" />
    </div>
  </template>
</template>

<style scoped>
.back { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 14px; margin-bottom: 12px; min-height: 32px; } .back:hover { color: var(--ink); }
.who { display: flex; flex-direction: column; font-size: 14.5px; } .small { font-size: 13px; margin: 0; }
</style>
