<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { z } from 'zod'
import AuthCard from '@/components/layout/AuthCard.vue'
import TextField from '@/components/ui/TextField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useZodForm } from '@/composables/useZodForm'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { safeRedirect } from '@/router'
import { emailRule, optionalPhone, passwordRule, userNameRule } from '@/lib/validation'
import { toApiError } from '@/lib/errors'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const schema = z.object({
  userName: userNameRule, email: emailRule, password: passwordRule, confirmPassword: z.string().min(1, 'Confirm your password'),
  phone: optionalPhone, gender: z.string().optional(),
}).refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })

const f = useZodForm(schema, { userName: '', email: '', password: '', confirmPassword: '', phone: '', gender: '' })
const submitting = ref(false)
const formError = ref('')

const submit = f.handleSubmit(async (v) => {
  if (submitting.value) return
  submitting.value = true; formError.value = ''
  try {
    const loggedIn = await auth.signup({ userName: v.userName.trim(), email: v.email.trim(), password: v.password, confirmPassword: v.confirmPassword, ...(v.phone ? { phone: v.phone } : {}), ...(v.gender ? { gender: v.gender } : {}) })
    if (loggedIn) {
      ui.success('Your account is ready')
      await router.replace(safeRedirect(route.query.redirect, '/account'))
    } else {
      await router.replace({ name: 'verify-email', query: { email: v.email.trim() } })
    }
  } catch (e) {
    const err = toApiError(e)
    if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.status === 409 ? 'An account with this email already exists. Try signing in instead.' : err.message
  } finally { submitting.value = false }
})
</script>

<template>
  <AuthCard title="Create your account" subtitle="Save your cart, track orders and keep a wishlist.">
    <form class="stack" style="--gap: 16px" novalidate @submit.prevent="submit">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <TextField v-bind="f.bind('userName')" label="User name" autocomplete="username" required hint="3–30 characters" />
      <TextField v-bind="f.bind('email')" label="Email" type="email" inputmode="email" autocomplete="email" required />
      <TextField v-bind="f.bind('password')" label="Password" type="password" autocomplete="new-password" required hint="8–64 characters with at least one letter and one number" />
      <TextField v-bind="f.bind('confirmPassword')" label="Confirm password" type="password" autocomplete="new-password" required />
      <TextField v-bind="f.bind('phone')" label="Phone (optional)" type="tel" inputmode="tel" autocomplete="tel" />
      <SelectField v-bind="f.bind('gender')" label="Gender (optional)" placeholder="Prefer not to say" :options="[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]" />
      <BaseButton type="submit" block :loading="submitting">Create account</BaseButton>
    </form>
    <template #footer>Already have an account? <RouterLink :to="{ name: 'login', query: route.query.redirect ? { redirect: String(route.query.redirect) } : {} }" class="link">Sign in</RouterLink></template>
  </AuthCard>
</template>
