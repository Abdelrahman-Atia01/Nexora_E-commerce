<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Package } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAsync } from '@/composables/useAsync'
import { ordersApi } from '@/features/orders/api'
import { formatDate, formatMoney } from '@/lib/format'

const route = useRoute()
const router = useRouter()
const page = computed(() => Math.max(1, parseInt(String(route.query.page ?? '1'), 10) || 1))
const orders = useAsync((s) => ordersApi.list({ page: page.value, limit: 8, sort: '-createdAt' }, s), [page])
const go = (p: number) => router.push({ query: p > 1 ? { page: String(p) } : {} })
</script>

<template>
  <div class="stack" style="--gap: 24px">
    <h1>Orders</h1>
    <ErrorState v-if="orders.error.value" :message="orders.error.value.message" :network="orders.error.value.isNetwork" @retry="orders.reload" />
    <div v-else-if="orders.loading.value && !orders.data.value" class="stack"><Skeleton v-for="n in 4" :key="n" height="84px" /></div>
    <EmptyState v-else-if="!orders.data.value?.data.length" title="No orders yet" message="When you place an order it will show up here." :icon="Package"><BaseButton :to="{ name: 'products' }">Start shopping</BaseButton></EmptyState>
    <template v-else>
      <ul class="stack" style="--gap: 12px">
        <li v-for="o in orders.data.value.data" :key="o._id">
          <RouterLink :to="{ name: 'order', params: { id: o._id } }" class="panel card">
            <div class="min"><strong class="mono">#{{ o._id.slice(-8).toUpperCase() }}</strong><span class="muted">{{ formatDate(o.createdAt, true) }} · {{ o.items.reduce((n, i) => n + i.quantity, 0) }} item(s)</span></div>
            <StatusBadge :status="o.status" />
            <strong class="tabular total">{{ formatMoney(o.totalPrice) }}</strong>
          </RouterLink>
        </li>
      </ul>
      <Pagination :page="orders.data.value.pagination.page" :pages="orders.data.value.pagination.pages" @change="go" />
    </template>
  </div>
</template>

<style scoped>
.card { display: grid; grid-template-columns: 1fr auto; gap: 8px 16px; align-items: center; transition: border-color var(--t); }
.card:hover { border-color: var(--ink); }
.min { display: flex; flex-direction: column; gap: 2px; font-size: 14px; }
.total { grid-column: 2; grid-row: 1; text-align: right; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
@media (min-width: 640px) { .card { grid-template-columns: 1fr auto 120px; } .total { grid-column: auto; grid-row: auto; } }
</style>
