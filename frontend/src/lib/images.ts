import { ASSET_BASE_URL } from './config'

/** Resolves absolute URLs as-is and relative upload paths against the backend origin. */
export const resolveImageUrl = (src?: string | null): string => {
  if (!src) return ''
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) return src
  return `${ASSET_BASE_URL}/${src.replace(/^\/+/, '')}`
}
