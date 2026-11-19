<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import TextField from '@/components/ui/TextField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppImage from '@/components/ui/AppImage.vue'
import { useZodForm } from '@/composables/useZodForm'
import { accountApi } from '@/features/account/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { optionalPhone, userNameRule } from '@/lib/validation'
import { toApiError } from '@/lib/errors'
import { formatDate } from '@/lib/format'

const auth = useAuthStore()
const ui = useUiStore()
const u = auth.user!
const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '')

const schema = z.object({ userName: userNameRule, phone: optionalPhone, gender: z.string(), BDD: z.string().optional() })
const f = useZodForm(schema, { userName: u.userName, phone: u.phone ?? '', gender: u.gender ?? 'not specified', BDD: toDateInput(u.BDD) })
const file = ref<File[]>([])
const saving = ref(false)
const formError = ref('')

const save = f.handleSubmit(async (v) => {
  if (saving.value) return
  saving.value = true; formError.value = ''
  try {
    let body: FormData | Record<string, unknown>
    if (file.value.length) {
      const fd = new FormData()
      fd.append('userName', v.userName.trim()); fd.append('gender', v.gender)
      if (v.phone) fd.append('phone', v.phone)
      if (v.BDD) fd.append('BDD', v.BDD)
      fd.append('image', file.value[0]!)
      body = fd
    } else {
      body = { userName: v.userName.trim(), gender: v.gender, ...(v.phone ? { phone: v.phone } : {}), ...(v.BDD ? { BDD: v.BDD } : {}) }
    }
    auth.user = await accountApi.updateMe(body)
    file.value = []
    ui.success('Profile updated')
  } catch (e) { const err = toApiError(e); if (!f.applyServerErrors(err.fieldErrors)) formError.value = err.message } finally { saving.value = false }
})
</script>

<template>
  <div class="stack" style="--gap: 24px">
    <h1>Profile</h1>
    <form class="panel stack" novalidate @submit.prevent="save">
      <div class="who">
        <div class="av"><AppImage :src="auth.user?.image" :alt="`${auth.user?.userName} avatar`" ratio="1 / 1" rounded /></div>
        <div><strong>{{ auth.user?.email }}</strong><p class="muted small">Member since {{ formatDate(auth.user?.createdAt) }} · {{ auth.user?.confirmEmail ? 'Email confirmed' : 'Email not confirmed yet' }}</p></div>
      </div>
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <div class="form-grid two">
        <TextField v-bind="f.bind('userName')" label="User name" required autocomplete="username" />
        <TextField v-bind="f.bind('phone')" label="Phone" type="tel" inputmode="tel" autocomplete="tel" />
        <SelectField v-bind="f.bind('gender')" label="Gender" :options="[{ value: 'not specified', label: 'Prefer not to say' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]" />
        <TextField v-bind="f.bind('BDD')" label="Date of birth" type="date" autocomplete="bday" />
        <div class="span-2"><ImageUpload v-model:files="file" label="Profile photo" hint="JPEG, PNG or WebP, up to 5 MB." :existing="auth.user?.image ? [auth.user.image] : []" /></div>
      </div>
      <div><BaseButton type="submit" :loading="saving">Save changes</BaseButton></div>
    </form>
  </div>
</template>

<style scoped>
.who { display: flex; gap: 16px; align-items: center; padding-bottom: 8px; }
.av { width: 64px; flex: none; }
.small { font-size: 13px; }
</style>
