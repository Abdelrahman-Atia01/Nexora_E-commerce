<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { z } from 'zod'
import AuthCard from '@/components/layout/AuthCard.vue'
import TextField from '@/components/ui/TextField.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useZodForm } from '@/composables/useZodForm'
import { authApi } from '@/features/auth/api'
import { useUiStore } from '@/stores/ui'
import { emailRule, passwordRule } from '@/lib/validation'
import { toApiError } from '@/lib/errors'

const router = useRouter()
const ui = useUiStore()
// Backend flow: POST forgot-password → POST verify-reset-code (6 digits, valid 10 min) → PATCH reset-password
const step = ref<1 | 2 | 3>(1)
const submitting = ref(false)
const formError = ref('')
const email = ref('')

const schema = z.object({ email: emailRule, code: z.string(), newPassword: z.string(), confirm: z.string() })
const f = useZodForm(schema, { email: '', code: '', newPassword: '', confirm: '' })

const wrap = async (fn: () => Promise<void>) => {
  if (submitting.value) return
  submitting.value = true; formError.value = ''
  try { await fn() } catch (e) { const err = toApiError(e); if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.message } finally { submitting.value = false }
}

const sendCode = async () => {
  const r = emailRule.safeParse(f.get<string>('email'))
  if (!r.success) { f.form.setFieldError('email' as never, r.error.issues[0]!.message); return }
  await wrap(async () => { email.value = r.data; await authApi.forgotPassword(email.value); step.value = 2; ui.info('If that email has an account, a 6-digit code is on its way.') })
}
const verify = async () => {
  const code = (f.get<string>('code') ?? '').trim()
  if (!/^\d{6}$/.test(code)) { f.form.setFieldError('code' as never, 'Enter the 6-digit code'); return }
  await wrap(async () => { await authApi.verifyResetCode(email.value, code); step.value = 3 })
}
const reset = async () => {
  const pw = passwordRule.safeParse(f.get<string>('newPassword'))
  if (!pw.success) { f.form.setFieldError('newPassword' as never, pw.error.issues[0]!.message); return }
  if (f.get<string>('newPassword') !== f.get<string>('confirm')) { f.form.setFieldError('confirm' as never, 'Passwords do not match'); return }
  await wrap(async () => { await authApi.resetPassword(email.value, pw.data); await router.replace({ name: 'login', query: { reset: '1' } }) })
}
const titles = { 1: 'Reset your password', 2: 'Enter the code', 3: 'Choose a new password' } as const
const subs = computed(() => ({ 1: 'Enter your email and we will send you a 6-digit code.', 2: `We sent a code to ${email.value}. It is valid for 10 minutes.`, 3: 'Pick a strong password you have not used before.' })[step.value])
</script>

<template>
  <AuthCard :title="titles[step]" :subtitle="subs">
    <ol class="steps" aria-label="Progress"><li v-for="n in 3" :key="n" :class="{ on: n <= step }" :aria-current="n === step ? 'step' : undefined"><span class="sr-only">Step {{ n }}</span></li></ol>
    <form class="stack" style="--gap: 16px" novalidate @submit.prevent="step === 1 ? sendCode() : step === 2 ? verify() : reset()">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <template v-if="step === 1"><TextField v-bind="f.bind('email')" label="Email" type="email" inputmode="email" autocomplete="email" required /><BaseButton type="submit" block :loading="submitting">Send code</BaseButton></template>
      <template v-else-if="step === 2">
        <TextField v-bind="f.bind('code')" label="6-digit code" inputmode="numeric" autocomplete="one-time-code" :maxlength="6" required />
        <BaseButton type="submit" block :loading="submitting">Verify code</BaseButton>
        <BaseButton variant="ghost" block :disabled="submitting" @click="step = 1">Use a different email</BaseButton>
      </template>
      <template v-else>
        <TextField v-bind="f.bind('newPassword')" label="New password" type="password" autocomplete="new-password" required hint="8–64 characters with a letter and a number" />
        <TextField v-bind="f.bind('confirm')" label="Confirm new password" type="password" autocomplete="new-password" required />
        <BaseButton type="submit" block :loading="submitting">Update password</BaseButton>
      </template>
    </form>
    <template #footer><RouterLink :to="{ name: 'login' }" class="link">Back to sign in</RouterLink></template>
  </AuthCard>
</template>

<style scoped>
.steps { display: flex; gap: 6px; margin-bottom: 20px; }
.steps li { flex: 1; height: 4px; border-radius: 2px; background: var(--border); }
.steps li.on { background: var(--brand); }
</style>
