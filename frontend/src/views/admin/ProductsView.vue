<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus, Pencil, Trash2, Package } from 'lucide-vue-next'
import AdminHeader from '@/features/admin/components/AdminHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import AppImage from '@/components/ui/AppImage.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useAsync } from '@/composables/useAsync'
import { useListQuery } from '@/composables/useListQuery'
import { productsApi } from '@/features/products/api'
import { formatMoney, hasDiscount, stockLabel } from '@/lib/format'
import { errorMessage } from '@/lib/errors'
import { useUiStore } from '@/stores/ui'
import type { Product } from '@/types/api'

const ui = useUiStore()
const { keyword, page, setKeyword, setPage } = useListQuery()
const list = useAsync((s) => productsApi.list({ keyword: keyword.value, page: page.value, limit: 10, sort: '-createdAt' }, s), [keyword, page])
const deleting = ref('')
const catName = (p: Product) => (typeof p.category === 'object' ? p.category.name : '—')
const rows = computed(() => list.data.value?.data ?? [])

const remove = async (p: Product) => {
  if (!(await ui.confirm({ title: 'Delete product?', message: `“${p.title}” will be permanently removed from the store. Existing orders keep their own copy of the item.`, confirmLabel: 'Delete product', danger: true }))) return
  deleting.value = p._id
  try {
    await productsApi.remove(p._id)
    ui.success('Product deleted')
    if (rows.value.length === 1 && page.value > 1) setPage(page.value - 1)
    else await list.reload()
  } catch (e) { ui.error(errorMessage(e)) } finally { deleting.value = '' }
}
</script>

<template>
  <AdminHeader title="Products" subtitle="Everything customers can buy.">
    <BaseButton :to="{ name: 'admin-product-new' }"><Plus :size="16" aria-hidden="true" /> New product</BaseButton>
  </AdminHeader>
  <div class="bar"><SearchInput :model-value="keyword" placeholder="Search by title or description" label="Search products" :loading="list.loading.value" @update:model-value="setKeyword" @submit="setKeyword" /></div>
  <ErrorState v-if="list.error.value" :message="list.error.value.message" :network="list.error.value.isNetwork" @retry="list.reload" />
  <div v-else-if="list.loading.value && !list.data.value" class="stack"><Skeleton v-for="n in 5" :key="n" height="64px" /></div>
  <EmptyState v-else-if="!rows.length" :title="keyword ? 'No products match your search' : 'No products yet'" :message="keyword ? 'Try a different keyword.' : 'Create your first product to start selling.'" :icon="Package">
    <BaseButton v-if="keyword" variant="secondary" @click="setKeyword('')">Clear search</BaseButton>
    <BaseButton v-else :to="{ name: 'admin-product-new' }">New product</BaseButton>
  </EmptyState>
  <template v-else>
    <div class="table-wrap" :aria-busy="list.loading.value"><table class="table">
      <thead><tr><th>Product</th><th>Category</th><th class="num">Price</th><th>Stock</th><th class="num">Sold</th><th class="actions"><span class="sr-only">Actions</span></th></tr></thead>
      <tbody><tr v-for="p in rows" :key="p._id">
        <td><div class="prod"><div class="th"><AppImage :src="p.imageCover" :alt="p.title" ratio="1 / 1" /></div><RouterLink :to="{ name: 'admin-product-edit', params: { id: p._id } }" class="link-plain">{{ p.title }}</RouterLink></div></td>
        <td>{{ catName(p) }}</td>
        <td class="num"><template v-if="hasDiscount(p)"><strong>{{ formatMoney(p.priceAfterDiscount) }}</strong><br /><s class="muted small">{{ formatMoney(p.price) }}</s></template><template v-else>{{ formatMoney(p.price) }}</template></td>
        <td><span :class="['badge', `badge-${stockLabel(p.quantity).tone}`]">{{ p.quantity }} · {{ stockLabel(p.quantity).text }}</span></td>
        <td class="num">{{ p.sold }}</td>
        <td class="actions">
          <BaseButton :to="{ name: 'admin-product-edit', params: { id: p._id } }" variant="ghost" size="sm" :aria-label="`Edit ${p.title}`"><Pencil :size="16" aria-hidden="true" /></BaseButton>
          <BaseButton variant="ghost" size="sm" :loading="deleting === p._id" :aria-label="`Delete ${p.title}`" @click="remove(p)"><Trash2 :size="16" aria-hidden="true" /></BaseButton>
        </td>
      </tr></tbody></table></div>
    <Pagination v-if="list.data.value" :page="list.data.value.pagination.page" :pages="list.data.value.pagination.pages" @change="setPage" />
    <p v-if="list.data.value" class="muted small total">{{ list.data.value.pagination.total }} product{{ list.data.value.pagination.total === 1 ? '' : 's' }}</p>
  </template>
</template>

<style scoped>
.bar { max-width: 420px; margin-bottom: 16px; }
.prod { display: flex; align-items: center; gap: 12px; min-width: 240px; } .th { width: 44px; flex: none; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); }
.link-plain { font-weight: 600; } .link-plain:hover { text-decoration: underline; }
.small { font-size: 12.5px; } .total { text-align: center; margin-top: 8px; }
</style>
