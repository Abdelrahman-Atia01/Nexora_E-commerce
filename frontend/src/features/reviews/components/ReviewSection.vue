<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Star, Trash2, Pencil, MessageSquare } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import RatingStars from '@/components/ui/RatingStars.vue'
import TextAreaField from '@/components/ui/TextAreaField.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { reviewsApi } from '../api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useAsync } from '@/composables/useAsync'
import { formatDate, initials } from '@/lib/format'
import { toApiError } from '@/lib/errors'
import type { Review } from '@/types/api'

const props = defineProps<{ productId: string; average: number; count: number }>()
const emit = defineEmits<{ changed: [] }>()
const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()

const page = ref(1)
const loaded = ref<Review[]>([])
const list = useAsync(() => reviewsApi.forProduct(props.productId, { page: page.value }), [page, () => props.productId], { immediate: true })
watch(() => list.data.value, (d) => {
  if (!d) return
  loaded.value = d.pagination.page === 1 ? d.data : [...loaded.value, ...d.data.filter((r) => !loaded.value.some((x) => x._id === r._id))]
})
watch(() => props.productId, () => { page.value = 1; loaded.value = [] })
const hasMore = computed(() => !!list.data.value && list.data.value.pagination.page < list.data.value.pagination.pages)

// The reviewer's own review (one per user per product — enforced by the backend with a unique index).
const mine = useAsync(async (signal) => {
  if (!auth.isCustomer || !auth.user) return null
  const r = await reviewsApi.forProduct(props.productId, { user: auth.user._id, limit: 1 })
  void signal
  return r.data[0] ?? null
}, [() => auth.user?._id, () => props.productId])

const editing = ref(false)
const rating = ref(0)
const comment = ref('')
const submitting = ref(false)
const err = ref('')
const startEdit = () => { rating.value = mine.data.value?.rating ?? 0; comment.value = mine.data.value?.comment ?? ''; editing.value = true; err.value = '' }
watch(() => mine.data.value, (m) => { if (m) { rating.value = m.rating; comment.value = m.comment ?? '' } })

const refreshAll = async () => {
  page.value = 1
  loaded.value = []
  await Promise.all([list.reload(), mine.reload()])
  emit('changed')
}

const submit = async () => {
  if (submitting.value) return
  err.value = ''
  if (rating.value < 1) { err.value = 'Please choose a star rating.'; return }
  submitting.value = true
  try {
    const body = { rating: rating.value, comment: comment.value.trim() || undefined }
    if (mine.data.value) await reviewsApi.update(mine.data.value._id, { rating: body.rating, comment: comment.value.trim() })
    else await reviewsApi.create(props.productId, body)
    ui.success(mine.data.value ? 'Your review was updated' : 'Thanks — your review was saved')
    editing.value = false
    await refreshAll()
  } catch (e) {
    const a = toApiError(e)
    err.value = a.status === 409 ? 'You have already reviewed this product. Edit your existing review instead.' : a.fieldErrors.comment || a.fieldErrors.rating || a.message
    if (a.status === 409) await mine.reload()
  } finally { submitting.value = false }
}

const remove = async (r: Review) => {
  const own = typeof r.user === 'object' && r.user._id === auth.user?._id
  if (!(await ui.confirm({ title: 'Delete review?', message: own ? 'Your review will be removed and the product rating recalculated.' : 'This review will be permanently removed.', confirmLabel: 'Delete', danger: true }))) return
  try { await reviewsApi.remove(r._id); ui.success('Review deleted'); editing.value = false; await refreshAll() } catch (e) { ui.error(toApiError(e).message) }
}

const name = (r: Review) => (typeof r.user === 'object' ? r.user.userName : 'Customer')
const isMine = (r: Review) => typeof r.user === 'object' && r.user._id === auth.user?._id
const showForm = computed(() => auth.isCustomer && (!mine.data.value || editing.value))
</script>

<template>
  <section class="reviews" aria-labelledby="rev-h">
    <div class="summary">
      <h2 id="rev-h">Reviews</h2>
      <div v-if="count" class="avg"><span class="big tabular">{{ average.toFixed(1) }}</span><div><RatingStars :value="average" :size="16" :show-count="false" /><p class="muted">{{ count }} {{ count === 1 ? 'review' : 'reviews' }}</p></div></div>
    </div>

    <div class="body">
      <div v-if="auth.isAdmin" class="note muted">You are signed in as an administrator. Administrators can remove reviews but cannot write them.</div>
      <div v-else-if="!auth.isAuthed" class="note"><RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }" class="link">Sign in</RouterLink> to write a review.</div>

      <form v-if="showForm" class="form panel" @submit.prevent="submit" novalidate>
        <h3>{{ mine.data.value ? 'Edit your review' : 'Write a review' }}</h3>
        <div class="field">
          <span class="field-label" id="rate-l">Your rating <span class="req" aria-hidden="true">*</span></span>
          <div class="stars" role="radiogroup" aria-labelledby="rate-l">
            <button v-for="n in 5" :key="n" type="button" role="radio" :aria-checked="rating === n" :aria-label="`${n} star${n > 1 ? 's' : ''}`" :class="{ on: n <= rating }" @click="rating = n"><Star :size="26" :fill="n <= rating ? 'currentColor' : 'none'" /></button>
          </div>
        </div>
        <TextAreaField v-model="comment" label="Comment (optional)" :rows="4" :maxlength="1000" placeholder="What did you like or dislike?" />
        <p v-if="err" class="form-error" role="alert">{{ err }}</p>
        <div class="row-wrap"><BaseButton type="submit" :loading="submitting">{{ mine.data.value ? 'Save changes' : 'Submit review' }}</BaseButton><BaseButton v-if="editing" variant="ghost" @click="editing = false">Cancel</BaseButton></div>
      </form>

      <ErrorState v-if="list.error.value && !loaded.length" :message="list.error.value.message" :network="list.error.value.isNetwork" @retry="list.reload" />
      <EmptyState v-else-if="!list.loading.value && !loaded.length" :icon="MessageSquare" title="No reviews yet" message="Be the first to share your thoughts on this product." />
      <ul v-else class="list">
        <li v-for="r in loaded" :key="r._id" class="rev">
          <span class="av" aria-hidden="true">{{ initials(name(r)) }}</span>
          <div class="rb">
            <div class="top"><strong>{{ name(r) }}</strong><span v-if="isMine(r)" class="badge badge-neutral">Your review</span><span class="muted date">{{ formatDate(r.createdAt) }}</span></div>
            <RatingStars :value="r.rating" :size="14" :show-count="false" />
            <p v-if="r.comment" class="cmt">{{ r.comment }}</p>
            <div v-if="isMine(r) || auth.isAdmin" class="row" style="gap: 4px; margin-top: 4px">
              <BaseButton v-if="isMine(r)" size="sm" variant="ghost" @click="startEdit"><Pencil :size="14" /> Edit</BaseButton>
              <BaseButton size="sm" variant="ghost" @click="remove(r)"><Trash2 :size="14" /> Delete</BaseButton>
            </div>
          </div>
        </li>
      </ul>
      <div v-if="hasMore" style="text-align: center"><BaseButton variant="secondary" :loading="list.loading.value" @click="page++">Show more reviews</BaseButton></div>
    </div>
  </section>
</template>

<style scoped>
.reviews { display: grid; gap: 28px; }
.summary { display: flex; flex-direction: column; gap: 16px; }
.avg { display: flex; align-items: center; gap: 14px; }
.big { font: 700 44px/1 var(--font-display); }
.body { display: flex; flex-direction: column; gap: 24px; min-width: 0; max-width: 760px; }
.note { padding: 12px 14px; background: var(--brand-soft); border-radius: var(--radius); font-size: 14px; }
.form { display: flex; flex-direction: column; gap: 16px; }
.stars { display: flex; gap: 2px; }
.stars button { width: 44px; height: 44px; display: grid; place-items: center; border: 0; background: none; color: #9AA39C; border-radius: var(--radius); }
.stars button.on { color: var(--accent-ink); }
.stars button:hover { background: #F0F1ED; }
.list { display: flex; flex-direction: column; }
.rev { display: flex; gap: 14px; padding: 20px 0; border-bottom: 1px solid var(--border); }
.rev:first-child { padding-top: 0; }
.av { width: 40px; height: 40px; border-radius: 999px; background: var(--brand-soft); color: var(--brand); display: grid; place-items: center; font-weight: 700; font-size: 13px; flex: none; }
.rb { min-width: 0; display: flex; flex-direction: column; gap: 4px; flex: 1; }
.top { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.date { font-size: 12.5px; }
.cmt { white-space: pre-line; overflow-wrap: anywhere; }
@media (min-width: 900px) { .reviews { grid-template-columns: 260px 1fr; gap: 56px; } }
</style>
