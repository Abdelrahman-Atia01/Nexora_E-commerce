import axios, { type AxiosRequestConfig } from 'axios'
import { API_BASE_URL } from './config'
import { getToken } from './session'
import { toApiError, ApiError } from './errors'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Do not treat a 401 from this request as an expired session (login, signup, …). */
    skipAuthHandling?: boolean
  }
}

type Listener = (reason: 'expired' | 'deactivated') => void
let onSessionEnd: Listener | null = null
export const setSessionEndHandler = (fn: Listener): void => { onSessionEnd = fn }

export const http = axios.create({ baseURL: API_BASE_URL, timeout: 20000 })

// Axios sets the multipart boundary itself for FormData — never set Content-Type manually.
http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const apiErr = toApiError(error)
    const hadToken = !!getToken()
    if (hadToken && !error?.config?.skipAuthHandling && onSessionEnd) {
      if (apiErr.status === 401) onSessionEnd('expired')
      else if (apiErr.status === 403 && /deactivated/i.test(apiErr.message)) onSessionEnd('deactivated')
    }
    return Promise.reject(apiErr)
  },
)

/** Unwraps `{ status, data }` responses. */
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => (await http.get(url, config)).data as T

export type { ApiError }
