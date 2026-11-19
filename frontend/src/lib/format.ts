import { CURRENCY } from './config'
import type { Product } from '@/types/api'

let formatter: Intl.NumberFormat
try {
  formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 })
} catch {
  formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
}

export const formatMoney = (n: number | null | undefined): string => formatter.format(Number.isFinite(n as number) ? (n as number) : 0)

export const formatDate = (iso?: string | null, withTime = false): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Price the customer pays per unit: the discounted price when valid, otherwise the regular one. */
export const currentPrice = (p: Pick<Product, 'price' | 'priceAfterDiscount'>): number =>
  hasDiscount(p) ? (p.priceAfterDiscount as number) : p.price

export const hasDiscount = (p: Pick<Product, 'price' | 'priceAfterDiscount'>): boolean =>
  typeof p.priceAfterDiscount === 'number' && p.priceAfterDiscount > 0 && p.priceAfterDiscount < p.price

export const discountPercent = (p: Pick<Product, 'price' | 'priceAfterDiscount'>): number =>
  hasDiscount(p) ? Math.round((1 - (p.priceAfterDiscount as number) / p.price) * 100) : 0

export const stockLabel = (qty: number): { text: string; tone: 'ok' | 'low' | 'out' } =>
  qty <= 0 ? { text: 'Out of stock', tone: 'out' } : qty <= 5 ? { text: `Only ${qty} left`, tone: 'low' } : { text: 'In stock', tone: 'ok' }

export const initials = (name?: string): string =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join('') || '?'
