<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { MailCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-vue-next'
import AuthCard from '@/components/layout/AuthCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TextField from '@/components/ui/TextField.vue'
import { authApi } from '@/features/auth/api'
import { errorMessage } from '@/lib/errors'

const props = defineProps<{ token?: string }>()
const route = useRoute()
const state = ref<'idle' | 'working' | 'ok' | 'fail'>('idle')
const message = ref('')
const pasted = ref('')
const pasteError = ref('')

const confirm = async (token: string) => {
  state.value = 'working'
  try { message.value = (await authApi.confirmEmail(token)).message; state.value = 'ok' } catch (e) { message.value = errorMessage(e); state.value = 'fail' }
}
onMounted(() => { if (props.token) confirm(props.token) })

// The email contains a link to the API (…/auth/confirm-email/<token>); accept the whole link or just the token.
const submitPasted = () => {
  pasteError.value = ''
  const raw = pasted.value.trim()
  const token = raw.split('/').filter(Boolean).pop()?.split('?')[0]
  if (!token || token.length < 20) { pasteError.value = 'Paste the confirmation link from your email.'; return }
  confirm(token)
}
</script>

<template>
  <AuthCard :title="state === 'ok' ? 'Email confirmed' : 'Confirm your email'">
    <div class="stack" style="--gap: 16px">
      <template v-if="state === 'working'"><p class="row"><Loader2 :size="20" class="spin" aria-hidden="true" /> Confirming your email…</p></template>
      <template v-else-if="state === 'ok'">
        <p class="row ok" role="status"><CheckCircle2 :size="22" aria-hidden="true" /> {{ message }}</p>
        <BaseButton block :to="{ name: 'login' }">Sign in</BaseButton>
      </template>
      <template v-else>
        <p v-if="state === 'fail'" class="form-error" role="alert"><XCircle :size="18" aria-hidden="true" style="flex: none" /> {{ message }}</p>
        <div v-else class="info"><MailCheck :size="28" :stroke-width="1.5" aria-hidden="true" /><div>
          <p><strong>Check your inbox<template v-if="route.query.email"> at {{ route.query.email }}</template>.</strong></p>
          <p class="muted">We sent you a confirmation link. Open it to activate your account — links are valid for 24 hours.</p></div></div>
        <form class="stack" style="--gap: 12px" @submit.prevent="submitPasted">
          <TextField v-model="pasted" label="Have the link? Paste it here" placeholder="…/auth/confirm-email/…" :error="pasteError" autocomplete="off" />
          <BaseButton type="submit" variant="secondary" block>Confirm email</BaseButton>
        </form>
        <p class="muted small">The API has no “resend” option, so if the link expired please contact the store.</p>
      </template>
    </div>
    <template #footer><RouterLink :to="{ name: 'login' }" class="link">Back to sign in</RouterLink></template>
  </AuthCard>
</template>

<style scoped>
.ok { color: #17583A; font-weight: 600; }
.info { display: flex; gap: 14px; padding: 16px; background: var(--brand-soft); border-radius: var(--radius); }
.info svg { color: var(--brand); flex: none; }
.small { font-size: 13px; }
</style>
