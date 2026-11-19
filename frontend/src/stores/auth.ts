import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi, type SignupPayload } from '@/features/auth/api'
import { accountApi } from '@/features/account/api'
import { clearToken, getToken, isPersistent, setToken } from '@/lib/session'
import type { User } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(getToken())
  const ready = ref(false)

  const isAuthed = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  /** Admin accounts cannot use cart/reviews endpoints (backend restricts them to role "user"). */
  const isCustomer = computed(() => user.value?.role === 'user')

  const apply = (newToken: string, u: User, remember = true) => {
    setToken(newToken, remember)
    token.value = newToken
    user.value = u
  }

  /** Restores the session on app start. A failed request must not log the user out on network errors. */
  const init = async () => {
    if (!token.value) { ready.value = true; return }
    try {
      user.value = await accountApi.me()
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 401 || status === 403) reset()
    } finally {
      ready.value = true
    }
  }

  const login = async (email: string, password: string, remember: boolean) => {
    const res = await authApi.login(email, password)
    apply(res.token as string, res.data, remember)
  }

  /** Returns true when the API logged the user in (email confirmation not required). */
  const signup = async (p: SignupPayload, remember = true) => {
    const res = await authApi.signup(p)
    if (res.token) { apply(res.token, res.data, remember); return true }
    return false
  }

  /** Password change/reset issues a new token and invalidates the old one. */
  const replaceToken = (newToken: string) => {
    setToken(newToken, isPersistent())
    token.value = newToken
  }

  const reset = () => {
    clearToken()
    token.value = null
    user.value = null
  }

  const refresh = async () => { user.value = await accountApi.me() }

  return { user, token, ready, isAuthed, isAdmin, isCustomer, init, login, signup, apply, replaceToken, reset, refresh }
})
