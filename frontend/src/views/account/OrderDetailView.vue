<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import OrderSummary from '@/features/orders/components/OrderSummary.vue'
import { useAsync } from '@/composables/useAsync'
import { ordersApi } from '@/features/orders/api'
import { useUiStore } from '@/stores/ui'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'

const props = defineProps<{ id: string }>()
const ui = useUiStore()
const { data: order, error, loading, reload } = useAsync(() => ordersApi.get(props.id), [() => props.id])
const cancelling = ref(false)

const cancel = async () => {
  if (!order.value) return
  if (!(await ui.confirm({ title: 'Cancel this order?', message: 'The items will go back into stock. This cannot be undone.', confirmLabel: 'Cancel order', danger: true }))) return
  cancelling.value = true
  try { await ordersApi.cancel(order.value._id); ui.success('Order cancelled'); await reload() } catch (e) { ui.error(errorMessage(e)); await reload() } finally { cancelling.value = false }
}
</script>

<template>
  <div class="stack" style="--gap: 20px">
    <RouterLink :to="{ name: 'orders' }" class="back"><ArrowLeft :size="16" /> All orders</RouterLink>
    <ErrorState v-if="error" :message="error.status === 404 ? 'We could not find this order.' : error.message" :network="error.isNetwork" @retry="reload" />
    <Skeleton v-else-if="loading && !order" height="380px" />
    <template v-else-if="order">
      <div class="spread wrap">
        <div><h1>Order #{{ order._id.slice(-8).toUpperCase() }}</h1><p class="muted">Placed {{ formatDate(order.createdAt, true) }}</p></div>
        <StatusBadge :status="order.status" />
      </div>
      <OrderSummary :order="order" />
      <ul class="timeline muted">
        <li>Placed — {{ formatDate(order.createdAt, true) }}</li>
        <li v-if="order.isPaid">Paid — {{ formatDate(order.paidAt, true) }}</li>
        <li v-if="order.isDelivered">Delivered — {{ formatDate(order.deliveredAt, true) }}</li>
        <li v-if="order.status === 'cancelled'">Cancelled — {{ formatDate(order.cancelledAt, true) }}</li>
      </ul>
      <div v-if="order.status === 'pending'"><BaseButton variant="secondary" :loading="cancelling" @click="cancel">Cancel order</BaseButton></div>
    </template>
  </div>
</template>

<style scoped>
.back { display: inline-flex; gap: 6px; align-items: center; font-size: 14px; font-weight: 600; width: fit-content; }
.back:hover { text-decoration: underline; }
.wrap { flex-wrap: wrap; }
.timeline { font-size: 14px; display: flex; flex-direction: column; gap: 4px; }
</style>
