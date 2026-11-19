<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { MessageSquare, Trash2 } from 'lucide-vue-next'
import AdminHeader from '@/features/admin/components/AdminHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import RatingStars from '@/components/ui/RatingStars.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import SelectField from '@/components/ui/SelectField.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useAsync } from '@/composables/useAsync'
import { useListQuery } from '@/composables/useListQuery'
import { reviewsApi } from '@/features/reviews/api'
import { useUiStore } from '@/stores/ui'
import { formatDate } from '@/lib/format'
import { errorMessage } from '@/lib/errors'
import type { Review } from '@/types/api'

const ui = useUiStore()
const { keyword, page, extra, setKeyword, setPage, setExtra } = useListQuery(['rating'])
const list = useAsync(() => reviewsApi.all({ keyword: keyword.value, page: page.value, limit: 10, sort: '-createdAt', ...(extra.value.rating ? { rating: extra.value.rating } : {}) }), [keyword, page, () => extra.value.rating])
const rows = computed(() => list.data.value?.data ?? [])
const removing = ref('')
const ratings = [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? 's' : ''}` }))
const who = (r: Review) => (typeof r.user === 'object' ? r.user.userName : 'Unknown user')

const remove = async (r: Review) => {
  if (!(await ui.confirm({ title: 'Delete review?', message: `The review by ${who(r)} will be removed and the product rating recalculated.`, confirmLabel: 'Delete review', danger: true }))) return
  removing.value = r._id
  try {
    await reviewsApi.remove(r._id); ui.success('Review deleted')
    if (rows.value.length === 1 && page.value > 1) setPage(page.value - 1); else await list.reload()
  } catch (e) { ui.error(errorMessage(e)) } finally { removing.value = '' }
}
</script>

<template>
  <AdminHeader title="Reviews" subtitle="Moderate customer reviews. Only deletion is available to administrators." />
  <div class="filters">
    <div class="grow"><SearchInput :model-value="keyword" placeholder="Search review text" label="Search reviews" :loading="list.loading.value" @update:model-value="setKeyword" @submit="setKeyword" /></div>
    <SelectField :model-value="extra.rating" label="Rating" placeholder="All ratings" :options="ratings" @update:model-value="(v) => setExtra('rating', v)" />
  </div>
  <ErrorState v-if="list.error.value" :message="list.error.value.message" :network="list.error.value.isNetwork" @retry="list.reload" />
  <div v-else-if="list.loading.value && !list.data.value" class="stack"><Skeleton v-for="n in 4" :key="n" height="72px" /></div>
  <EmptyState v-else-if="!rows.length" :icon="MessageSquare" :title="keyword || extra.rating ? 'No reviews match' : 'No reviews yet'" :message="keyword || extra.rating ? 'Adjust the filters.' : 'Reviews appear here when customers rate products.'" />
  <template v-else>
    <ul class="stack" style="--gap: 12px">
      <li v-for="r in rows" :key="r._id" class="panel rv">
        <div class="meta"><RatingStars :value="r.rating" /><strong>{{ who(r) }}</strong><span class="muted">{{ formatDate(r.createdAt) }}</span></div>
        <p>{{ r.comment || 'No written comment.' }}</p>
        <div class="row-wrap"><RouterLink class="link" :to="{ name: 'product', params: { id: r.product } }">View product</RouterLink>
          <BaseButton variant="ghost" size="sm" :loading="removing === r._id" @click="remove(r)"><Trash2 :size="16" aria-hidden="true" /> Delete</BaseButton></div>
      </li>
    </ul>
    <Pagination v-if="list.data.value" :page="list.data.value.pagination.page" :pages="list.data.value.pagination.pages" @change="setPage" />
  </template>
</template>

<style scoped>
.filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin-bottom: 16px; } .grow { flex: 1 1 260px; max-width: 420px; } .filters :deep(.field) { min-width: 180px; }
.rv { display: grid; gap: 8px; } .rv p { margin: 0; overflow-wrap: anywhere; } .meta { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: center; font-size: 14px; }
</style>
