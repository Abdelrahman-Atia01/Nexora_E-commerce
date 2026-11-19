import { expect, test, type Page } from '@playwright/test'

const stamp = Date.now()
const email = `shopper${stamp}@example.com`
const password = 'Passw0rd!x'

const signIn = async (page: Page, mail: string, pass: string) => {
  await page.goto('/account/login')
  await page.getByLabel('Email').fill(mail)
  await page.getByLabel(/^Password/).fill(pass)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test.describe.serial('customer journey', () => {
  test('home shows real categories and products', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /shop by category/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /^Men/ }).first()).toBeVisible()
    await expect(page.locator('a[href^="/products/"]').nth(3)).toBeVisible()
  })

  test('catalog filters live in the URL', async ({ page }) => {
    await page.goto('/products?sort=price&inStock=1&min=500&max=1000')
    await expect(page.getByText('Heavyweight Tee').first()).toBeVisible()
    await expect(page.getByText('Studio Watch')).toHaveCount(0) // out of stock
    await expect(page.getByText('Runner Shoes')).toHaveCount(0) // above max price
    await page.goto('/search?q=hoodie')
    await expect(page.getByText('Urban Hoodie').first()).toBeVisible()
    await page.goto('/search?q=zzzzzz')
    await expect(page.getByText(/no products|no results|nothing/i).first()).toBeVisible()
  })

  test('guest is sent to sign in; customer registers', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible()
    await page.goto('/account/register')
    await page.getByLabel('User name').fill('Test Shopper')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/^Password/).fill(password)
    await page.getByLabel(/^Confirm password/).fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/(account|$)/)
    await expect(page.getByRole('link', { name: /cart/i }).first()).toBeVisible()
  })

  test('add to cart, coupon, checkout, confirmation, cancel', async ({ page }) => {
    await signIn(page, email, password)
    await page.waitForURL((u) => !u.pathname.includes('login'))
    await page.goto('/products?q=Beast')
    await page.getByRole('link', { name: /Beast Compression Tee/ }).first().click()
    await page.getByRole('button', { name: 'Add to cart' }).click()
    await expect(page.getByText('Please choose a colour.')).toBeVisible()
    await page.getByRole('radio', { name: 'Black' }).click()
    await page.getByRole('button', { name: 'Add to cart' }).click()
    await expect(page.getByText(/added to your cart|added to cart/i).first()).toBeVisible()
    await page.goto('/cart')
    await expect(page.getByText('Beast Compression Tee')).toBeVisible()
    await page.locator('#coupon').fill('NOPE')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText(/invalid or expired/i)).toBeVisible()
    await page.locator('#coupon').fill('save10')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText(/SAVE10/)).toBeVisible()
    await page.getByRole('link', { name: 'Proceed to checkout' }).click()
    await page.getByRole('button', { name: /place order|confirm order/i }).click() // validation first
    await expect(page.getByText(/required|enter/i).first()).toBeVisible()
    await page.getByLabel(/Delivery address/).fill('12 Tahrir Street, Flat 4')
    await page.getByLabel(/^Phone/).fill('+20 101 234 5678')
    await page.getByLabel('City').fill('Tanta')
    await page.getByRole('button', { name: /place order|confirm order/i }).click()
    await expect(page).toHaveURL(/checkout\/confirmation\//)
    await expect(page.getByText(/cash on delivery/i).first()).toBeVisible()
    await page.getByRole('link', { name: 'View order' }).click()
    await page.getByRole('button', { name: 'Cancel order' }).click()
    await page.getByRole('button', { name: /^cancel order$/i }).last().click().catch(() => {})
    await expect(page.getByText('Cancelled').first()).toBeVisible()
  })

  test('wishlist and review', async ({ page }) => {
    await signIn(page, email, password)
    await page.waitForURL((u) => !u.pathname.includes('login'))
    await page.goto('/products?q=Classic')
    await page.getByRole('link', { name: /Classic Cap/ }).first().click()
    await page.getByRole('button', { name: /wishlist/i }).first().click()
    await page.goto('/account/wishlist')
    await expect(page.getByText('Classic Cap').first()).toBeVisible()
    await page.getByRole('link', { name: /Classic Cap/ }).first().click()
    await page.getByRole('radio', { name: /5 stars/ }).check({ force: true }).catch(async () => { await page.getByLabel('5 stars').click({ force: true }) })
    await page.getByLabel(/Comment/).fill('Great cap, fits well.')
    await page.getByRole('button', { name: 'Submit review' }).click()
    await expect(page.getByText('Great cap, fits well.').first()).toBeVisible()
  })

  test('customer cannot open the admin area', async ({ page }) => {
    await signIn(page, email, password)
    await page.waitForURL((u) => !u.pathname.includes('login'))
    await page.goto('/admin')
    await expect(page).toHaveURL(/forbidden/)
  })
})

test.describe.serial('admin', () => {
  test('dashboard, catalog CRUD and order handling', async ({ page }) => {
    await signIn(page, 'admin@example.com', 'Admin@12345')
    await page.waitForURL(/admin/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText(/Revenue, last 14 days/)).toBeVisible()

    await page.goto('/admin/categories')
    await page.getByRole('button', { name: /new category/i }).click()
    await page.getByLabel('Name').fill('E2E Category')
    await page.getByRole('button', { name: 'Create category' }).click()
    await expect(page.getByText('E2E Category').first()).toBeVisible()

    await page.goto('/admin/coupons')
    await page.getByRole('button', { name: /new coupon/i }).click()
    await page.getByLabel('Code').fill('e2e20')
    await page.getByLabel('Discount (%)').fill('20')
    await page.getByLabel('Expires on').fill(new Date(Date.now() + 40 * 864e5).toISOString().slice(0, 10))
    await page.getByRole('button', { name: 'Create coupon' }).click()
    await expect(page.getByText('E2E20')).toBeVisible()

    await page.goto('/admin/products/new')
    await page.getByLabel('Title').fill('E2E Product')
    await page.getByLabel('Description').fill('A product created by the end-to-end test suite for checking.')
    await page.getByLabel(/^Price/).fill('300')
    await page.getByLabel('Discounted price').fill('250')
    await page.getByLabel('Stock quantity').fill('7')
    await page.getByLabel('Category').selectOption({ label: 'E2E Category' })
    await page.locator('input[type=file]').first().setInputFiles('/home/claude/work/testdata/img/tee1.png')
    await page.getByRole('button', { name: 'Create product' }).click()
    await expect(page).toHaveURL(/admin\/products$/)
    await expect(page.getByText('E2E Product').first()).toBeVisible()

    // edit: remove the discount (needs the small backend fix)
    await page.getByRole('link', { name: 'E2E Product' }).first().click()
    await page.getByLabel('Discounted price').fill('')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page).toHaveURL(/admin\/products$/)

    await page.goto('/admin/orders')
    await page.getByRole('button', { name: 'Cancelled' }).click()
    await expect(page.getByRole('link', { name: /#/ }).first()).toBeVisible()

    await page.goto('/admin/users')
    await expect(page.getByText(email)).toBeVisible()
  })
})
