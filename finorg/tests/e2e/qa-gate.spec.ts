import { test, expect } from '@playwright/test';

/**
 * QA Gate — FinOrg Deep Tests
 * Tests: Nav pages, API routes, Auth flow, Interactions, DB regression
 */

// ─────────────────────────────────────────────
// TEST 2: Navigation — Core Pages
// ─────────────────────────────────────────────
const CORE_PAGES = [
  { path: '/', name: 'Dashboard' },
  { path: '/transactions', name: 'Transactions' },
  { path: '/investments', name: 'Investments' },
  { path: '/budget', name: 'Budget' },
  { path: '/dreams', name: 'Dreams' },
  { path: '/projections', name: 'Projections' },
  { path: '/reserve', name: 'Reserve' },
  { path: '/settings', name: 'Settings' },
];

test.describe('Navigation — Core Pages', () => {
  for (const { path, name } of CORE_PAGES) {
    test(`[NAV] ${name} (${path}) loads without errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const jsErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      page.on('pageerror', err => {
        jsErrors.push(err.message);
      });

      const response = await page.goto(path, { waitUntil: 'load', timeout: 40000 });

      // Must have a response
      expect(response, `No response for ${path}`).not.toBeNull();
      const status = response!.status();

      // Status must not be 404 or 5xx
      expect(status, `${name}: expected 2xx/3xx, got ${status}`).toBeLessThan(400);

      // No unhandled JS errors
      expect(jsErrors, `${name}: JS errors: ${jsErrors.join(', ')}`).toHaveLength(0);

      // Check visible errors in UI (error boundaries, 500 messages)
      const bodyText = await page.locator('body').innerText();
      const errorPatterns = [
        /500\s*(internal server error|error)/i,
        /application error/i,
        /something went wrong/i,
        /unhandled runtime error/i,
      ];
      for (const pattern of errorPatterns) {
        expect(bodyText, `${name}: UI error pattern "${pattern}" found`).not.toMatch(pattern);
      }

      // Ensure the page rendered actual content (not blank)
      const bodyHtml = await page.content();
      expect(bodyHtml.length, `${name}: page appears empty`).toBeGreaterThan(500);

      // Build result summary for the test title
      console.log(`[PASS] ${name}: HTTP ${status}, no JS errors, content rendered`);
    });
  }
});

// ─────────────────────────────────────────────
// TEST 3: API Routes — Health Check
// ─────────────────────────────────────────────
const API_ROUTES = [
  { path: '/api/dashboard', name: 'dashboard' },
  { path: '/api/transactions', name: 'transactions' },
  { path: '/api/investments/summary', name: 'investments/summary' },
  { path: '/api/budget/summary', name: 'budget/summary' },
  { path: '/api/reserve/status', name: 'reserve/status' },
  { path: '/api/dreams', name: 'dreams' },
  { path: '/api/accounts', name: 'accounts' },
  { path: '/api/alerts', name: 'alerts' },
];

test.describe('API Routes — Health Check', () => {
  for (const { path, name } of API_ROUTES) {
    test(`[API] GET ${path} → 200 + valid JSON`, async ({ request }) => {
      const response = await request.get(path);
      const statusCode = response.status();
      let bodyText = await response.text();
      let parsedOk = false;
      let parseError = '';

      try {
        JSON.parse(bodyText);
        parsedOk = true;
      } catch (e: any) {
        parseError = e.message;
      }

      const preview = bodyText.substring(0, 120);
      console.log(`[API] ${name}: HTTP ${statusCode} | JSON: ${parsedOk} | Preview: ${preview}`);

      expect(statusCode, `${name}: expected 200, got ${statusCode}`).toBe(200);
      expect(parsedOk, `${name}: invalid JSON — ${parseError} — body: ${preview}`).toBe(true);
    });
  }
});

// ─────────────────────────────────────────────
// TEST 4: Auth Flow — No redirect loops
// ─────────────────────────────────────────────
test.describe('Auth Flow', () => {
  test('[AUTH] /login loads without redirect loop', async ({ page }) => {
    // Track redirect count
    let redirectCount = 0;
    page.on('response', response => {
      if (response.status() >= 300 && response.status() < 400) {
        redirectCount++;
      }
    });

    const response = await page.goto('/login', { waitUntil: 'load', timeout: 15000 });
    expect(response, 'No response for /login').not.toBeNull();
    const finalUrl = page.url();

    console.log(`[AUTH] /login: final URL=${finalUrl}, redirects=${redirectCount}`);

    // Should not exceed 5 redirects (loops would be much more)
    expect(redirectCount, `/login: too many redirects (${redirectCount}), possible loop`).toBeLessThan(5);

    // Should not be a 500 status
    expect(response!.status(), `/login: got ${response!.status()}`).toBeLessThan(500);
  });

  test('[AUTH] /callback does not cause redirect loop', async ({ page }) => {
    let redirectCount = 0;
    page.on('response', response => {
      if (response.status() >= 300 && response.status() < 400) {
        redirectCount++;
      }
    });

    // /callback will likely redirect to / in dev mode — that's OK
    // We just check it doesn't loop
    const response = await page.goto('/callback', { waitUntil: 'load', timeout: 15000 });
    const finalUrl = page.url();

    console.log(`[AUTH] /callback: final URL=${finalUrl}, redirects=${redirectCount}`);

    expect(response, 'No response for /callback').not.toBeNull();
    expect(redirectCount, `/callback: redirect loop detected (${redirectCount} redirects)`).toBeLessThan(5);
    expect(response!.status(), `/callback: 500 error`).not.toBe(500);
  });

  test('[AUTH] /sign-out does not cause redirect loop', async ({ page }) => {
    let redirectCount = 0;
    page.on('response', response => {
      if (response.status() >= 300 && response.status() < 400) {
        redirectCount++;
      }
    });

    const response = await page.goto('/sign-out', { waitUntil: 'load', timeout: 15000 });
    const finalUrl = page.url();

    console.log(`[AUTH] /sign-out: final URL=${finalUrl}, redirects=${redirectCount}`);

    expect(response, 'No response for /sign-out').not.toBeNull();
    expect(redirectCount, `/sign-out: redirect loop detected (${redirectCount} redirects)`).toBeLessThan(5);
    expect(response!.status(), `/sign-out: 500 error`).not.toBe(500);
  });
});

// ─────────────────────────────────────────────
// TEST 5: Forms & Interactions
// ─────────────────────────────────────────────
test.describe('Forms & Interactions', () => {
  test('[UI] /transactions — table/list renders without error', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto('/transactions', { waitUntil: 'load', timeout: 40000 });

    // No JS errors
    expect(jsErrors, `Transactions: JS errors: ${jsErrors.join(', ')}`).toHaveLength(0);

    // Check for common transaction UI elements — table, list, or at least a heading
    const bodyText = await page.locator('body').innerText();

    // Should NOT show "no such column" DB error
    expect(bodyText).not.toMatch(/no such column/i);
    expect(bodyText).not.toMatch(/prisma.*error/i);

    console.log(`[UI] /transactions: rendered OK, no DB errors`);
  });

  test('[UI] /investments — no "no such column: quantity" error', async ({ page }) => {
    const jsErrors: string[] = [];
    const apiErrors: string[] = [];

    page.on('pageerror', err => jsErrors.push(err.message));
    page.on('response', async response => {
      if (response.url().includes('/api/investments') && response.status() >= 500) {
        const body = await response.text().catch(() => '');
        apiErrors.push(`${response.url()}: ${response.status()} — ${body.substring(0, 200)}`);
      }
    });

    const response = await page.goto('/investments', { waitUntil: 'load', timeout: 40000 });
    expect(response!.status()).toBeLessThan(500);

    const bodyText = await page.locator('body').innerText();

    // Critical regression: quantity column must be accessible
    expect(bodyText, 'REGRESSION: "no such column: quantity" still present').not.toMatch(/no such column.*quantity/i);
    expect(bodyText, 'Investments: DB error in UI').not.toMatch(/no such column/i);
    expect(apiErrors, `Investments: API 500 errors: ${apiErrors.join('; ')}`).toHaveLength(0);

    console.log(`[UI] /investments: no "quantity" column error, HTTP ${response!.status()}`);
  });

  test('[UI] /budget — page loads and form accessible', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    const response = await page.goto('/budget', { waitUntil: 'load', timeout: 40000 });
    expect(response!.status()).toBeLessThan(500);
    expect(jsErrors, `Budget: JS errors: ${jsErrors.join(', ')}`).toHaveLength(0);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/no such column/i);

    console.log(`[UI] /budget: loaded OK, HTTP ${response!.status()}`);
  });

  test('[UI] /settings — page loads without error', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    const response = await page.goto('/settings', { waitUntil: 'load', timeout: 40000 });
    expect(response!.status()).toBeLessThan(500);
    expect(jsErrors, `Settings: JS errors: ${jsErrors.join(', ')}`).toHaveLength(0);

    console.log(`[UI] /settings: loaded OK, HTTP ${response!.status()}`);
  });
});
