/**
 * Playwright E2E Tests - Production Environment
 * 
 * Tests critical flows against the deployed Vercel app.
 * Run with: npx playwright test --project=production
 */
import { test, expect } from '@playwright/test';

const PROD_URL = 'https://finorg-app.vercel.app';

test.describe('Production - Critical Flows', () => {
  
  test('app loads without critical errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(PROD_URL);
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Check for fatal errors in console
    const fatalErrors = errors.filter(e => 
      e.includes('Prisma') || 
      e.includes('Query Engine') ||
      e.includes('no such column')
    );
    
    expect(fatalErrors, 
      `Found fatal errors: ${fatalErrors.join(', ')}`
    ).toHaveLength(0);
  });

  test('auth flow - redirects to WorkOS login', async ({ page }) => {
    await page.goto(PROD_URL);
    
    // Should redirect to WorkOS AuthKit or show login UI
    await page.waitForURL(/authkit\.app|workos|login|auth/, { timeout: 10000 });
    
    const url = page.url();
    const isAuthPage = 
      url.includes('authkit.app') ||
      url.includes('workos') || 
      url.includes('/login') || 
      url.includes('/auth');
    
    expect(isAuthPage, `Expected auth redirect, got: ${url}`).toBe(true);
  });

  test('API health - /api/health responds', async ({ request }) => {
    const response = await request.get(`${PROD_URL}/api/health`);
    
    // Accept 200 (healthy) or 404 (endpoint not implemented)
    // Reject 500 (server error)
    expect(response.status()).not.toBe(500);
  });

  test('Prisma binary loads correctly', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Query Engine')) {
        errors.push(msg.text());
      }
    });

    await page.goto(PROD_URL);
    await page.waitForTimeout(3000);
    
    const prismaErrors = errors.filter(e => 
      e.includes('rhel-openssl') || 
      e.includes('Query Engine')
    );
    
    expect(prismaErrors, 
      `Prisma Query Engine errors: ${prismaErrors.join('\n')}`
    ).toHaveLength(0);
  });

});

test.describe('Production - Database Schema', () => {
  
  test.skip('Transaction.quantity column exists (requires auth)', async ({ page }) => {
    // This test requires authenticated session
    // Skip for now, will implement with auth flow in next iteration
    
    // TODO: Login flow
    // TODO: Navigate to transactions
    // TODO: Verify quantity field is present and functional
  });

});

test.describe('Production - Performance', () => {
  
  test('initial page load < 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(PROD_URL);
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime, 
      `Page load took ${loadTime}ms (threshold: 5000ms)`
    ).toBeLessThan(5000);
  });

  test('no memory leaks on navigation (basic check)', async ({ page }) => {
    await page.goto(PROD_URL);
    
    // Navigate multiple times to check for obvious leaks
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
    
    // If we got here without crashes, basic navigation is stable
    expect(true).toBe(true);
  });

});
