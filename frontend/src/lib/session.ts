// Token storage. The backend issues a bearer JWT in the response body (no cookies), so the SPA has to
// keep it client-side. "Remember me" uses localStorage (persists); otherwise sessionStorage (tab only).
// Trade-off: any XSS could read it. Mitigations: no v-html anywhere, strict input handling, 7-day expiry,
// and the backend invalidates tokens on password change.
const KEY = 'nexora.token'
let memory: string | null = null

const safe = <T>(fn: () => T, fallback: T): T => {
  try { return fn() } catch { return fallback }
}

export const getToken = (): string | null => {
  if (memory) return memory
  memory = safe(() => localStorage.getItem(KEY) || sessionStorage.getItem(KEY), null)
  return memory
}

export const setToken = (token: string, remember = true): void => {
  memory = token
  safe(() => { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY) }, undefined)
  safe(() => (remember ? localStorage : sessionStorage).setItem(KEY, token), undefined)
}

export const isPersistent = (): boolean => safe(() => !!localStorage.getItem(KEY), false)

export const clearToken = (): void => {
  memory = null
  safe(() => { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY) }, undefined)
}
