const rawBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:6200/api/v1').replace(/\/+$/, '')

export const API_BASE_URL = rawBase
export const CURRENCY = import.meta.env.VITE_CURRENCY || 'EGP'

const originOf = (u: string): string => {
  try {
    return new URL(u, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').origin
  } catch {
    return ''
  }
}
export const ASSET_BASE_URL = (import.meta.env.VITE_ASSET_BASE_URL || originOf(rawBase)).replace(/\/+$/, '')
