<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ClipboardList } from 'lucide-vue-next'
import AdminHeader from '@/features/admin/components/AdminHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useAsync } from '@/composables/useAsync'
import { useListQuery } from '@/composables/useListQuery'
import { ordersApi } from '@/features/orders/api'
import { formatDate, formatMoney } from '@/lib/format'

const { page, extra, setPage, setExtra } = useListQuery(['status'])
const list = useAsync((s) => ordersApi.list({ page: page.value, limit: 12, sort: '-createdAt', ...(extra.value.status ? { status: extra.value.status } : {}) }, s), [page, () => extra.value.status])
const rows = computed(() => list.data.value?.data ?? [])
const tabs = [{ v: '', l: 'All' }, { v: 'pending', l: 'Pending' }, { v: 'delivered', l: 'Delivered' }, { v: 'cancelled', l: 'Cancelled' }]
</script>

<template>
  <AdminHeader title="Orders" subtitle="Cash-on-delivery orders from your customers." />
  <div class="tabs" role="group" aria-label="Filter by status">
    <button v-for="t in tabs" :key="t.v" type="button" :class="{ on: extra.status === t.v }" :aria-pressed="extra.status === t.v" @click="setExtra('status', t.v)">{{ t.l }}</button>
  </div>
  <ErrorState v-if="list.error.value" :message="list.error.value.message" :network="list.error.value.isNetwork" @retry="list.reload" />
  <div v-else-if="list.loading.value && !list.data.value" class="stack"><Skeleton v-for="n in 5" :key="n" height="56px" /></div>
  <EmptyState v-else-if="!rows.length" :icon="ClipboardList" :title="extra.status ? `No ${extra.status} orders` : 'No orders yet'" message="Orders appear here as soon as customers check out."><BaseButton v-if="extra.status" variant="secondary" @click="setExtra('status', '')">Show all orders</BaseButton></EmptyState>
  <template v-else>
    <div class="table-wrap" :aria-busy="list.loading.value"><table class="table">
      <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Status</th><th>Payment</th><th class="num">Total</th></tr></thead>
      <tbody><tr v-for="o in rows" :key="o._id">
        <td><RouterLink class="link mono" :to="{ name: 'admin-order', params: { id: o._id } }">#{{ o._id.slice(-8).toUpperCase() }}</RouterLink></td>
        <td><template v-if="typeof o.user === 'object'">{{ o.user.userName }}<br /><span class="muted small">{{ o.user.email }}</span></template><template v-else>—</template></td>
        <td class="muted">{{ formatDate(o.createdAt, true) }}</td><td><StatusBadge :status="o.status" /></td>
        <td>{{ o.isPaid ? 'Paid' : 'Unpaid' }}</td><td class="num">{{ formatMoney(o.totalPrice) }}</td></tr></tbody></table></div>
    <Pagination v-if="list.data.value" :page="list.data.value.pagination.page" :pages="list.data.value.pagination.pages" @change="setPage" />
  </template>
</template>

<style scoped>
.tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.tabs button { min-height: 40px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); font-weight: 600; font-size: 14px; }
.tabs button:hover { border-color: var(--ink); } .tabs button.on { background: var(--ink); border-color: var(--ink); color: #fff; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; } .small { font-size: 12.5px; }
</style>
