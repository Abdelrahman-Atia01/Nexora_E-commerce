import fs from 'node:fs'
const API = 'http://localhost:6200/api/v1'
const j = async (r) => { const b = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(b)}`); return b }
const login = await j(await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'Admin@12345' }) }))
const H = { authorization: `Bearer ${login.token}` }
const file = (n) => new Blob([fs.readFileSync(`img/${n}.png`)], { type: 'image/png' })
const post = async (path, fields, files = {}) => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) (Array.isArray(v) ? v : [v]).forEach((x) => fd.append(k, x))
  for (const [k, v] of Object.entries(files)) (Array.isArray(v) ? v : [v]).forEach((n) => fd.append(k, file(n), `${n}.png`))
  return (await j(await fetch(`${API}${path}`, { method: 'POST', headers: H, body: fd }))).data
}
// remove the 10 seeded catalogue items that use unreachable external images? keep them; they test the image fallback.
const men = await post('/categories', { name: 'Men' }, { image: 'cat_men' })
const women = await post('/categories', { name: 'Women' }, { image: 'cat_women' })
const acc = await post('/categories', { name: 'Gear' }, { image: 'cat_acc' })
const nx = await post('/brands', { name: 'Nexora Lab' }, { image: 'brand_a' })
const ua = await post('/brands', { name: 'Urban Atelier' }, { image: 'brand_a_b' })
const tops = (await j(await fetch(`${API}/subcategories`, { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Tops', category: men._id }) }))).data
const bottoms = (await j(await fetch(`${API}/subcategories`, { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Bottoms', category: men._id }) }))).data
const desc = 'Engineered for performance and everyday comfort. Premium stretch fabric with a clean, structured fit.'
const P = [
  ['Beast Compression Tee', 899, null, 40, ['Black', 'Olive', '#1C5548'], men, nx, [tops], 'tee1', ['tee1_b', 'tee2']],
  ['Urban Hoodie', 1299, 999, 25, ['Black', 'Grey'], men, ua, [tops], 'hoodie', ['hoodie_b']],
  ['Flex Joggers', 1099, null, 18, [], men, nx, [bottoms], 'jogger', []],
  ['Classic Cap', 499, 399, 60, ['Black'], acc, ua, [], 'cap', []],
  ['Runner Shoes', 1799, null, 4, [], acc, nx, [], 'shoe', []],
  ['Daily Backpack', 1499, 1199, 12, ['Black'], acc, ua, [], 'bag', ['bag_b']],
  ['Studio Watch', 2499, null, 0, [], acc, nx, [], 'watch', []],
  ['Women Training Tee', 799, null, 33, ['White', 'Black'], women, nx, [], 'tee3', []],
  ['Women Studio Tee', 849, 699, 21, [], women, ua, [], 'tee4', []],
  ['Heavyweight Tee', 699, null, 50, ['Black'], men, ua, [tops], 'tee2', []],
]
for (const [title, price, disc, quantity, colors, cat, brand, subs, cover, gal] of P) {
  await post('/products', { title, description: `${title}. ${desc}`, price, ...(disc ? { priceAfterDiscount: disc } : {}), quantity, colors, category: cat._id, brand: brand._id, subcategories: subs.map((s) => s._id) }, { imageCover: cover, ...(gal.length ? { images: gal } : {}) })
}
await fetch(`${API}/coupons`, { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'SAVE10', discount: 10, expire: new Date(Date.now() + 90 * 864e5).toISOString() }) }).then(j)
console.log('seeded')
