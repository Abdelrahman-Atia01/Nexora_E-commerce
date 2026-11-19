import { expect, test } from '@playwright/test'
import fs from 'node:fs'

// Dev emails are printed to the backend console; point BACKEND_LOG at its captured output.
const LOG = process.env.BACKEND_LOG
const lastEmailFor = (to: string, subject: string): string => {
  const text = fs.readFileSync(LOG!, 'utf8')
  const blocks = text.split('[DEV EMAIL]').filter((b) => b.includes(`to: ${to}`) && b.includes(`subject: ${subject}`))
  return blocks[blocks.length - 1] ?? ''
}
const mail = `recover${Date.now()}@example.com`
const pass1 = 'FirstPass1!'
const pass2 = 'SecondPass2!'

test.describe.serial('auth edge cases', () => {
  test('wrong credentials show a clear error and keep the form', async ({ page }) => {
    await page.goto('/account/login')
    await page.getByLabel('Email').fill('nobody@example.com')
    await page.getByLabel(/^Password/).fill('whatever1')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Incorrect email or password')).toBeVisible()
    await expect(page.getByLabel('Email')).toHaveValue('nobody@example.com')
  })

  test('registration shows field errors from the backend rules', async ({ page }) => {
    await page.goto('/account/register')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText(/3–30 characters|required/i).first()).toBeVisible()
  })

  test('email confirmation page calls the API with the emailed token', async ({ page }) => {
    test.skip(!LOG, 'BACKEND_LOG not set')
    await page.goto('/account/register')
    await page.getByLabel('User name').fill('Recover Me')
    await page.getByLabel('Email').fill(mail)
    await page.getByLabel(/^Password/).fill(pass1)
    await page.getByLabel(/^Confirm password/).fill(pass1)
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.waitForURL((u) => !u.pathname.includes('register'))
    await expect.poll(() => lastEmailFor(mail, 'Confirm your email')).toContain('confirm-email/')
    const token = lastEmailFor(mail, 'Confirm your email').match(/confirm-email\/([\w.-]+)/)![1]
    await page.goto(`/account/confirm-email/${token}`)
    await expect(page.getByText(/confirmed/i).first()).toBeVisible()
    await page.goto('/account/confirm-email/not-a-real-token')
    await expect(page.getByText(/invalid|expired|could not/i).first()).toBeVisible()
  })

  test('forgot password: email -> code -> new password -> sign in', async ({ page }) => {
    test.skip(!LOG, 'BACKEND_LOG not set')
    await page.goto('/account/forgot-password')
    await page.getByLabel('Email').fill(mail)
    await page.getByRole('button', { name: /send/i }).click()
    await expect.poll(() => lastEmailFor(mail, 'Your password reset code')).not.toBe('')
    const body = lastEmailFor(mail, 'Your password reset code')
    const code = body.match(/\b(\d{6})\b/)![1]!
    await page.getByLabel('6-digit code').fill('000000')
    await page.getByRole('button', { name: /verify/i }).click()
    await expect(page.getByText(/invalid or expired/i)).toBeVisible()
    await page.getByLabel('6-digit code').fill(code)
    await page.getByRole('button', { name: /verify/i }).click()
    await page.getByLabel(/^New password/).fill(pass2)
    await page.getByLabel(/^Confirm new password/).fill(pass2)
    await page.getByRole('button', { name: /reset|update|save/i }).click()
    await expect(page).toHaveURL(/\/account\/login/)
    await page.goto('/account/login')
    await page.getByLabel('Email').fill(mail)
    await page.getByLabel(/^Password/).fill(pass2)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL((u) => !u.pathname.includes('login'))
    await expect(page.getByRole('link', { name: /cart/i }).first()).toBeVisible()
  })

  test('an expired or tampered session sends the user to sign in', async ({ page }) => {
    await page.goto('/account/login')
    await page.evaluate(() => localStorage.setItem('nexora.token', 'tampered.token.value'))
    await page.goto('/account/orders')
    await expect(page).toHaveURL(/account\/login/)
    await expect(page.getByText(/redirect=%2Faccount%2Forders|/)).toBeDefined()
    expect(await page.evaluate(() => localStorage.getItem('nexora.token'))).toBeNull()
  })

  test('network failure shows a retryable error, never fake products', async ({ page }) => {
    await page.route('**/api/v1/products**', (r) => r.abort())
    await page.goto('/products')
    await expect(page.getByText(/connection problem|cannot reach/i).first()).toBeVisible()
    await page.unroute('**/api/v1/products**')
    await page.getByRole('button', { name: /try again/i }).first().click()
    await expect(page.locator('a[href^="/products/"]').first()).toBeVisible()
  })
})

const widths = [360, 768, 1024, 1440]
const routes = ['/', '/products', '/search?q=tee', '/cart', '/account/login', '/account/register', '/account/forgot-password']
test.describe('responsive layouts (no horizontal overflow)', () => {
  for (const w of widths) {
    test(`public pages at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 })
      for (const r of routes) {
        await page.goto(r)
        await page.waitForLoadState('networkidle')
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(over, `${r} overflows by ${over}px at ${w}px`).toBeLessThanOrEqual(0)
      }
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: `test-results/shots/home-${w}.png`, fullPage: true })
      await page.goto('/products')
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: `test-results/shots/catalog-${w}.png`, fullPage: true })
    })
  }
  test('admin pages at 360px and 1440px', async ({ page }) => {
    await page.goto('/account/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel(/^Password/).fill('Admin@12345')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/admin/)
    for (const w of [360, 1440]) {
      await page.setViewportSize({ width: w, height: 900 })
      for (const r of ['/admin', '/admin/products', '/admin/orders', '/admin/coupons', '/admin/users', '/admin/categories', '/admin/products/new']) {
        await page.goto(r)
        await page.waitForLoadState('networkidle')
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(over, `${r} overflows by ${over}px at ${w}px`).toBeLessThanOrEqual(0)
      }
      await page.goto('/admin')
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: `test-results/shots/admin-${w}.png`, fullPage: true })
    }
  })
})
