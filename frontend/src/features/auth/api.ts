import { http } from '@/lib/http'
import type { AuthResponse } from '@/types/api'

export interface SignupPayload { userName: string; email: string; password: string; confirmPassword: string; gender?: string; phone?: string }

export const authApi = {
  signup: async (p: SignupPayload) => (await http.post<AuthResponse>('/auth/signup', p, { skipAuthHandling: true })).data,
  login: async (email: string, password: string) => (await http.post<AuthResponse>('/auth/login', { email, password }, { skipAuthHandling: true })).data,
  confirmEmail: async (token: string) => (await http.get<{ message: string }>(`/auth/confirm-email/${encodeURIComponent(token)}`, { skipAuthHandling: true })).data,
  forgotPassword: async (email: string) => (await http.post<{ message: string }>('/auth/forgot-password', { email }, { skipAuthHandling: true })).data,
  verifyResetCode: async (email: string, code: string) => (await http.post<{ message: string }>('/auth/verify-reset-code', { email, code }, { skipAuthHandling: true })).data,
  resetPassword: async (email: string, newPassword: string) => (await http.patch<{ message: string; token: string }>('/auth/reset-password', { email, newPassword }, { skipAuthHandling: true })).data,
}
