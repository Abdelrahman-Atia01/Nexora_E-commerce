import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { currentPrice, discountPercent, hasDiscount, stockLabel, formatMoney } from './format'
import { parseFilters, serializeFilters, toApiParams } from './query'
import { toApiError } from './errors'
import { resolveImageUrl } from './images'
import { safeRedirect } from '@/router'
import { dailyRevenue } from '@/features/admin/stats'

describe('price helpers', () => {
  it('uses the discounted price only when it is valid', () => {
    expect(currentPrice({ price: 100, priceAfterDiscount: 80 })).toBe(80)
    expect(currentPrice({ price: 100, priceAfterDiscount: null })).toBe(100)
    expect(currentPrice({ price: 100, priceAfterDiscount: 100 })).toBe(100)
    expect(hasDiscount({ price: 100, priceAfterDiscount: 0 })).toBe(false)
    expect(discountPercent({ price: 200, priceAfterDiscount: 150 })).toBe(25)
  })
  it('labels stock', () => {
    expect(stockLabel(0).tone).toBe('out')
    expect(stockLabel(3).text).toBe('Only 3 left')
    expect(stockLabel(50).tone).toBe('ok')
  })
  it('formats money', () => expect(formatMoney(1234.5)).toContain('1,234.50'))
})

describe('catalog query <-> URL', () => {
  it('round-trips filters and drops defaults', () => {
    const f = parseFilters({ q: ' shirt ', page: '3', sort: 'price', min: '10', inStock: '1' })
    expect(f).toMatchObject({ q: 'shirt', page: 3, sort: 'price', min: '10', inStock: true })
    expect(serializeFilters(f)).toEqual({ q: 'shirt', page: '3', sort: 'price', min: '10', inStock: '1' })
    expect(serializeFilters(parseFilters({}))).toEqual({})
  })
  it('ignores invalid values', () => {
    const f = parseFilters({ page: '-2', sort: 'nope', min: 'abc' })
    expect(f.page).toBe(1); expect(f.sort).toBe('-createdAt'); expect(f.min).toBe('')
  })
  it('builds the parameters the backend understands', () => {
    const p = toApiParams(parseFilters({ q: 'tee', category: 'c1', sub: 's1', brand: 'b1', min: '5', max: '50', inStock: '1', onSale: '1' }))
    expect(p).toMatchObject({ keyword: 'tee', category: 'c1', subcategories: 's1', brand: 'b1', 'price[gte]': '5', 'price[lte]': '50', 'quantity[gt]': 0, 'priceAfterDiscount[gt]': 0, limit: 12 })
  })
})

describe('error normalisation', () => {
  const axiosErr = (status: number, data: unknown) => new AxiosError('x', 'ERR', undefined, undefined, { status, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } })
  it('keeps field errors', () => {
    const e = toApiError(axiosErr(400, { status: 'fail', message: 'bad', errors: [{ field: 'email', message: 'invalid email format' }, { field: 'email', message: 'second' }] }))
    expect(e.status).toBe(400); expect(e.message).toBe('bad'); expect(e.fieldErrors).toEqual({ email: 'invalid email format' })
  })
  it('flags network failures and hides 5xx internals', () => {
    expect(toApiError(new AxiosError('Network Error')).isNetwork).toBe(true)
    expect(toApiError(axiosErr(500, { message: '' })).message).toMatch(/our side/)
  })
})

describe('misc', () => {
  it('resolves image urls', () => {
    expect(resolveImageUrl('https://x.test/a.jpg')).toBe('https://x.test/a.jpg')
    expect(resolveImageUrl('/uploads/a.jpg')).toMatch(/\/uploads\/a\.jpg$/)
    expect(resolveImageUrl('')).toBe('')
  })
  it('blocks open redirects', () => {
    expect(safeRedirect('/cart')).toBe('/cart')
    expect(safeRedirect('//evil.com')).toBe('/')
    expect(safeRedirect('https://evil.com')).toBe('/')
    expect(safeRedirect(undefined, '/account')).toBe('/account')
  })
  it('buckets revenue per local day', () => {
    const now = new Date(2026, 9, 15, 12)
    const r = dailyRevenue([{ totalPrice: 10, createdAt: new Date(2026, 9, 15, 9).toISOString() }, { totalPrice: 5.5, createdAt: new Date(2026, 9, 15, 20).toISOString() }, { totalPrice: 99, createdAt: new Date(2026, 8, 1).toISOString() }], 3, now)
    expect(r).toHaveLength(3); expect(r[2]).toEqual({ date: '2026-10-15', value: 15.5 }); expect(r[0]!.value).toBe(0)
  })
})
