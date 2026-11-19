<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Package, ClipboardList, Users, Clock } from 'lucide-vue-next'
import AdminHeader from '@/features/admin/components/AdminHeader.vue'
import SalesChart from '@/features/admin/components/SalesChart.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useAsync } from '@/composables/useAsync'
import { dailyRevenue, loadOverview } from '@/features/admin/stats'
import { formatDate, formatMoney } from '@/lib/format'

const ov = useAsync(() => loadOverview())
const d = computed(() => ov.data.value)
const series = computed(() => (d.value ? dailyRevenue(d.value.live, 14) : []))
const revenue = computed(() => Math.round((d.value?.live.reduce((s, o) => s + o.totalPrice, 0) ?? 0) * 100) / 100)
const last14 = computed(() => Math.round(series.value.reduce((s, p) => s + p.value, 0) * 100) / 100)
</script>

<template>
  <AdminHeader title="Dashboard" subtitle="Live figures from your store's orders, catalog and users." />
  <ErrorState v-if="ov.error.value" :message="ov.error.value.message" :network="ov.error.value.isNetwork" @retry="ov.reload" />
  <div v-else-if="!d" class="stats"><Skeleton v-for="n in 4" :key="n" height="104px" /></div>
  <div v-else class="stack" style="--gap: 24px">
    <div class="stats">
      <RouterLink :to="{ name: 'admin-products' }" class="stat"><Package :size="18" aria-hidden="true" /><span>Products</span><strong>{{ d.products }}</strong><small>{{ d.categories }} categories · {{ d.brands }} brands</small></RouterLink>
      <RouterLink :to="{ name: 'admin-orders' }" class="stat"><ClipboardList :size="18" aria-hidden="true" /><span>Orders</span><strong>{{ d.orders }}</strong><small>{{ d.delivered }} delivered · {{ d.cancelled }} cancelled</small></RouterLink>
      <RouterLink :to="{ name: 'admin-orders', query: { status: 'pending' } }" class="stat"><Clock :size="18" aria-hidden="true" /><span>Pending orders</span><strong>{{ d.pending }}</strong><small>Waiting for delivery</small></RouterLink>
      <RouterLink :to="{ name: 'admin-users' }" class="stat"><Users :size="18" aria-hidden="true" /><span>Users</span><strong>{{ d.users }}</strong><small>Registered accounts</small></RouterLink>
    </div>

    <section class="panel stack">
      <div class="spread" style="align-items: flex-start; flex-wrap: wrap">
        <div><h2>Revenue, last 14 days</h2><p class="muted small">Orders that are not cancelled. Cash on delivery, so orders are counted when placed.</p></div>
        <div class="tot"><strong class="tabular">{{ formatMoney(last14) }}</strong><span class="muted small">All-time (non-cancelled): {{ formatMoney(revenue) }}<template v-if="d.truncated"> — latest 500 orders only</template></span></div>
      </div>
      <SalesChart :points="series" />
    </section>

    <div class="two">
      <section class="stack">
        <div class="spread"><h2>Recent orders</h2><RouterLink :to="{ name: 'admin-orders' }" class="link">View all</RouterLink></div>
        <EmptyState v-if="!d.recent.length" title="No orders yet" message="Orders appear here as customers check out." />
        <div v-else class="table-wrap"><table class="table" style="min-width: 520px">
          <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th class="num">Total</th></tr></thead>
          <tbody><tr v-for="o in d.recent" :key="o._id">
            <td><RouterLink class="link" :to="{ name: 'admin-order', params: { id: o._id } }">#{{ o._id.slice(-8).toUpperCase() }}</RouterLink><br /><span class="muted small">{{ formatDate(o.createdAt) }}</span></td>
            <td class="truncate" style="max-width: 160px">{{ typeof o.user === 'object' ? o.user.userName : '—' }}</td>
            <td><StatusBadge :status="o.status" /></td><td class="num">{{ formatMoney(o.totalPrice) }}</td>
          </tr></tbody></table></div>
      </section>
      <section class="stack">
        <div class="spread"><h2>Low stock</h2><RouterLink :to="{ name: 'admin-products' }" class="link">Manage</RouterLink></div>
        <EmptyState v-if="!d.lowStock.length" title="Stock looks healthy" message="No product has 5 or fewer units left." />
        <ul v-else class="panel low">
          <li v-for="p in d.lowStock" :key="p._id"><RouterLink class="link-plain truncate" :to="{ name: 'admin-product-edit', params: { id: p._id } }">{{ p.title }}</RouterLink><span :class="['badge', p.quantity === 0 ? 'badge-out' : 'badge-low']">{{ p.quantity === 0 ? 'Out of stock' : `${p.quantity} left` }}</span></li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
h2 { font-size: 17px; } .small { font-size: 13px; margin: 2px 0 0; }
.stats { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
.stat { display: grid; gap: 2px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); transition: border-color var(--t); }
.stat:hover { border-color: var(--ink); } .stat svg { color: var(--brand); margin-bottom: 6px; }
.stat span { font-size: 13px; color: var(--muted); font-weight: 500; } .stat strong { font: 700 28px/1.2 var(--font-display); } .stat small { color: var(--muted); font-size: 12.5px; }
.tot { text-align: right; min-width: 0; display: flex; flex-direction: column; } .tot strong { font: 700 24px/1.2 var(--font-display); }
.two { display: grid; gap: 24px; } .two > * { min-width: 0; } @media (min-width: 1100px) { .two { grid-template-columns: 1.6fr 1fr; align-items: start; } }
.low { display: flex; flex-direction: column; gap: 12px; padding: 16px 18px; } .low li { display: flex; justify-content: space-between; gap: 12px; align-items: center; font-size: 14.5px; }
.link-plain:hover { text-decoration: underline; }
</style>
