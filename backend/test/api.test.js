// Tests that do not need a running MongoDB: routing, validation, auth guards, query-builder safety.
// Run: npm test
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

process.env.DB_URL ||= 'mongodb://127.0.0.1:27017/test'
process.env.JWT_SECRET ||= 'test-secret'
process.env.NODE_ENV = 'test'

const { app } = await import('../src/app.js')
const { default: ApiFeatures } = await import('../src/utils/apiFeatures.js')
const { productModel } = await import('../src/DB/models/product.model.js')
const { signToken } = await import('../src/utils/token.js')

let server, base
before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r() }) }))
after(() => server.close())

const call = (path, opts = {}) =>
  fetch(base + path, { ...opts, headers: { 'content-type': 'application/json', ...opts.headers } }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))

test('health', async () => {
  const r = await call('/health')
  assert.equal(r.status, 200)
})

test('unknown route -> 404 json', async () => {
  const r = await call('/api/v1/nope')
  assert.equal(r.status, 404)
  assert.equal(r.body.status, 'fail')
})

test('malformed JSON -> 400', async () => {
  const r = await call('/api/v1/auth/login', { method: 'POST', body: '{bad' })
  assert.equal(r.status, 400)
})

test('signup validation', async () => {
  const r = await call('/api/v1/auth/signup', { method: 'POST', body: JSON.stringify({ userName: 'ab', email: 'x', password: '123', confirmPassword: '1' }) })
  assert.equal(r.status, 400)
  assert.ok(r.body.errors.length >= 3)
})

test('login validation', async () => {
  const r = await call('/api/v1/auth/login', { method: 'POST', body: '{}' })
  assert.equal(r.status, 400)
})

test('protected routes require a token', async () => {
  for (const [m, p] of [['POST', '/api/v1/categories'], ['GET', '/api/v1/users/me'], ['GET', '/api/v1/cart'], ['GET', '/api/v1/orders'], ['DELETE', '/api/v1/products/507f1f77bcf86cd799439011']]) {
    const r = await call(p, { method: m })
    assert.equal(r.status, 401, `${m} ${p}`)
  }
})

test('invalid / purpose tokens rejected', async () => {
  assert.equal((await call('/api/v1/users/me', { headers: { authorization: 'Bearer garbage' } })).status, 401)
  const t = signToken({ id: '507f1f77bcf86cd799439011', purpose: 'confirm-email' })
  assert.equal((await call('/api/v1/users/me', { headers: { authorization: `Bearer ${t}` } })).status, 401)
})

test('invalid ObjectId -> 400 (no DB hit)', async () => {
  assert.equal((await call('/api/v1/categories/123')).status, 400)
  assert.equal((await call('/api/v1/products/abc')).status, 400)
})

test('ApiFeatures builds safe filters', () => {
  const f = new ApiFeatures(productModel.find(), {
    price: { gte: '10', $ne: '5', lt: '100' }, category: 'abc', $where: '1', password: 'x', page: '2', 'a.b': '1',
  }).filter().mongooseQuery.getFilter()
  assert.deepEqual(f.price, { $gte: '10', $lt: '100' })
  assert.equal(f.category, 'abc')
  assert.equal(f.$where, undefined)
  assert.equal(f.password, undefined)
})

test('ApiFeatures pagination is clamped', () => {
  const f = new ApiFeatures(productModel.find(), { page: '-4', limit: '100000' }).paginate()
  assert.deepEqual(f.pagination, { page: 1, limit: 100 })
})

test('product model: priceAfterDiscount must be lower than price', async () => {
  const p = new productModel({ title: 'abc', description: 'x'.repeat(25), quantity: 1, price: 10, priceAfterDiscount: 12, imageCover: 'a', category: '507f1f77bcf86cd799439011' })
  const err = p.validateSync()
  assert.match(err.errors.priceAfterDiscount.message, /lower than price/)
})
