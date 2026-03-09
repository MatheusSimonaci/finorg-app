import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

const BASE = 'http://localhost:3000'

// ─── Helper ───────────────────────────────────────────────────────────────────
async function checkConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))
  return errors
}

// ─── 1. Build validation (already done separately) ────────────────────────────

// ─── 2. Auth routes ───────────────────────────────────────────────────────────
test.describe('Auth routes — no redirect loop', () => {
  test('/login loads without infinite redirect', async ({ page }) => {
    const responses: number[] = []
    page.on('response', r => responses.push(r.status()))

    // Use domcontentloaded — WorkOS never reaches networkidle (keeps polling)
    await page.goto(`${BASE}/login`, { timeout: 15000, waitUntil: 'domcontentloaded' })

    // Should not 500
    expect(responses.some(s => s === 500)).toBe(false)
    // Should not have >3 redirects (loop indicator)
    const redirects = responses.filter(s => s >= 300 && s < 400)
    expect(redirects.length).toBeLessThan(4)
  })

  test('/callback without code redirects to login (not 500)', async ({ page }) => {
    const response = await page.goto(`${BASE}/callback`, { timeout: 10000 })
    // Without code param: should redirect to /login (302) or show login (200), never 500
    expect(response?.status()).not.toBe(500)
  })

  test('/sign-out responds without loop', async ({ page }) => {
    const response = await page.goto(`${BASE}/sign-out`, { timeout: 10000 })
    expect(response?.status()).not.toBe(500)
  })
})

// ─── 3. Core pages — no 500 errors ───────────────────────────────────────────
const PAGES = [
  '/',
  '/transactions',
  '/investments',
  '/budget',
  '/dreams',
  '/projections',
  '/reserve',
  '/settings',
]

test.describe('Core pages — no 500', () => {
  for (const path of PAGES) {
    test(`${path} returns non-500`, async ({ page }) => {
      const errors = await checkConsoleErrors(page)
      const response = await page.goto(`${BASE}${path}`, {
        timeout: 15000,
        waitUntil: 'domcontentloaded',
      })

      const status = response?.status() ?? 0
      expect(status, `${path} returned ${status}`).not.toBe(500)
      expect(status, `${path} returned ${status}`).not.toBe(0)

      // No JS runtime errors (filter WorkOS/auth CSP/redirect messages which are expected)
      const realErrors = errors.filter(
        e =>
          !e.includes('WorkOS') &&
          !e.includes('NEXT_REDIRECT') &&
          !e.includes('upgrade-insecure-requests') &&
          !e.includes('Content Security Policy')
      )
      expect(realErrors, `JS errors on ${path}`).toHaveLength(0)
    })
  }
})

// ─── 4. API routes — JSON responses ──────────────────────────────────────────
const API_ROUTES = [
  '/api/dashboard',
  '/api/transactions',
  '/api/investments/summary',
  '/api/budget/summary',
  '/api/reserve/status',
  '/api/dreams',
  '/api/accounts',
  '/api/alerts',
]

test.describe('API routes — no 500', () => {
  let request: APIRequestContext

  for (const route of API_ROUTES) {
    test(`${route} returns non-500`, async ({ request }) => {
      const response = await request.get(`${BASE}${route}`)
      // 401/redirect is OK (auth required), 500 is not
      expect(response.status(), `${route} returned ${response.status()}`).not.toBe(500)
    })
  }
})

// ─── 5. No "no such column" errors on investment routes ──────────────────────
test.describe('DB — quantity column regression', () => {
  test('/api/transactions returns no column error', async ({ request }) => {
    const response = await request.get(`${BASE}/api/transactions`)
    const text = await response.text()
    expect(text).not.toContain('no such column')
    expect(text).not.toContain('quantity')  // should not appear in error messages
  })

  test('/api/investments/summary returns no column error', async ({ request }) => {
    const response = await request.get(`${BASE}/api/investments/summary`)
    const text = await response.text()
    expect(text).not.toContain('no such column')
  })

  test('/api/assets returns no 500', async ({ request }) => {
    const response = await request.get(`${BASE}/api/assets`)
    expect(response.status()).not.toBe(500)
  })
})

// ─── 6. Homepage renders meaningful content ───────────────────────────────────
test.describe('Homepage — smoke render', () => {
  test('homepage renders with visible content', async ({ page }) => {
    await page.goto(`${BASE}/`, { timeout: 15000, waitUntil: 'domcontentloaded' })
    // Should have some HTML body content
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText.length).toBeGreaterThan(10)
  })
})
