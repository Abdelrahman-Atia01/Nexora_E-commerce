<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { z } from 'zod'
import AuthCard from '@/components/layout/AuthCard.vue'
import TextField from '@/components/ui/TextField.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useZodForm } from '@/composables/useZodForm'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { safeRedirect } from '@/router'
import { emailRule } from '@/lib/validation'
import { toApiError } from '@/lib/errors'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const f = useZodForm(z.object({ email: emailRule, password: z.string().min(1, 'Password is required') }), { email: '', password: '' })
const remember = ref(true)
const submitting = ref(false)
const formError = ref('')
const needsConfirm = ref(false)

const submit = f.handleSubmit(async (v) => {
  if (submitting.value) return
  submitting.value = true; formError.value = ''; needsConfirm.value = false
  try {
    await auth.login(v.email.trim(), v.password, remember.value)
    ui.success(`Welcome back, ${auth.user?.userName}`)
    await router.replace(safeRedirect(route.query.redirect, auth.isAdmin ? '/admin' : '/account'))
  } catch (e) {
    const err = toApiError(e)
    needsConfirm.value = err.status === 403 && /confirm/i.test(err.message)
    if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.message
    // keep the email, clear only the password after a failed attempt
    f.set('password', '')
  } finally { submitting.value = false }
})
</script>

<template>
  <AuthCard title="Sign in" subtitle="Welcome back. Enter your details to continue.">
    <form class="stack" style="--gap: 16px" novalidate @submit.prevent="submit">
      <p v-if="route.query.reset" class="note ok" role="status">Your password was updated. Sign in with the new password.</p>
      <p v-if="formError" class="form-error" role="alert"><span>{{ formError }}<template v-if="needsConfirm"> <RouterLink :to="{ name: 'verify-email' }" class="link">Confirm your email</RouterLink></template></span></p>
      <TextField v-bind="f.bind('email')" label="Email" type="email" inputmode="email" autocomplete="email" required />
      <TextField v-bind="f.bind('password')" label="Password" type="password" autocomplete="current-password" required />
      <div class="spread">
        <label class="check"><input v-model="remember" type="checkbox" /> Keep me signed in</label>
        <RouterLink :to="{ name: 'forgot-password' }" class="link small">Forgot password?</RouterLink>
      </div>
      <BaseButton type="submit" block :loading="submitting">Sign in</BaseButton>
    </form>
    <template #footer>New to NEXORA? <RouterLink :to="{ name: 'register', query: route.query.redirect ? { redirect: String(route.query.redirect) } : {} }" class="link">Create an account</RouterLink></template>
  </AuthCard>
</template>

<style scoped>
.small { font-size: 13.5px; }
.note.ok { padding: 12px 14px; border-radius: var(--radius); background: var(--success-soft); color: #17583A; font-size: 14px; }
</style>
