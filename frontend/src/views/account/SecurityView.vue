<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import TextField from '@/components/ui/TextField.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useZodForm } from '@/composables/useZodForm'
import { accountApi } from '@/features/account/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useSessionActions } from '@/app/session'
import { passwordRule } from '@/lib/validation'
import { toApiError } from '@/lib/errors'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const session = useSessionActions()

const schema = z.object({ currentPassword: z.string().min(1, 'Enter your current password'), newPassword: passwordRule, confirm: z.string().min(1, 'Confirm the new password') })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'Choose a password different from the current one' })
const f = useZodForm(schema, { currentPassword: '', newPassword: '', confirm: '' })
const saving = ref(false)
const formError = ref('')

const save = f.handleSubmit(async (v) => {
  if (saving.value) return
  saving.value = true; formError.value = ''
  try {
    const res = await accountApi.changePassword(v.currentPassword, v.newPassword)
    auth.replaceToken(res.token) // the old token is invalidated by the backend
    f.resetForm()
    ui.success('Password updated')
  } catch (e) { const err = toApiError(e); if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.message } finally { saving.value = false }
})

const deactivate = async () => {
  if (!(await ui.confirm({ title: 'Deactivate your account?', message: 'You will be signed out and will not be able to sign in again unless an administrator reactivates the account.', confirmLabel: 'Deactivate account', danger: true }))) return
  try { await accountApi.deactivate(); session.clearUserState(); ui.info('Your account has been deactivated.'); await router.replace({ name: 'home' }) } catch (e) { ui.error(toApiError(e).message) }
}
</script>

<template>
  <div class="stack" style="--gap: 24px">
    <h1>Security</h1>
    <form class="panel stack" novalidate @submit.prevent="save">
      <h2>Change password</h2>
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <div class="narrow stack" style="--gap: 16px">
        <TextField v-bind="f.bind('currentPassword')" label="Current password" type="password" autocomplete="current-password" required />
        <TextField v-bind="f.bind('newPassword')" label="New password" type="password" autocomplete="new-password" required hint="8–64 characters with a letter and a number" />
        <TextField v-bind="f.bind('confirm')" label="Confirm new password" type="password" autocomplete="new-password" required />
      </div>
      <div><BaseButton type="submit" :loading="saving">Update password</BaseButton></div>
    </form>
    <section class="panel stack danger">
      <h2>Deactivate account</h2>
      <p class="muted">Deactivating signs you out and blocks sign-in. Your past orders are kept by the store.</p>
      <div><BaseButton variant="danger" @click="deactivate">Deactivate my account</BaseButton></div>
    </section>
  </div>
</template>

<style scoped>
h2 { font-size: 18px; }
.narrow { max-width: 420px; }
.danger { border-color: #F0C4BF; }
</style>
