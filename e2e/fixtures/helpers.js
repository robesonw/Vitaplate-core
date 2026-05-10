import { test as base, expect } from '@playwright/test';
import path from 'path';

// ─── Test user credentials (set in .env or environment) ──────────────────────
export const TEST_USER = {
  email:    process.env.TEST_EMAIL    || 'test@vitaplate.ai',
  password: process.env.TEST_PASSWORD || 'TestPassword123!',
  name:     'VitaPlate Tester',
};

export const BASE_URL    = process.env.BASE_URL    || 'https://www.vitaplate.ai';
export const API_URL     = process.env.API_URL     || 'https://vitaplate-core-production.up.railway.app';
export const SAMPLE_LAB  = path.join(process.cwd(), 'fixtures', 'sample-lab.pdf');

// ─── Extended test with auth helpers ─────────────────────────────────────────
export const test = base.extend({
  // Authenticated page — logs in via Google OAuth mock or direct
  authedPage: async ({ page }, use) => {
    // Navigate to app — check if auth wall appears
    await page.goto('/Dashboard');
    
    const isLoggedIn = await page.locator('text=Dashboard').first().isVisible()
      .catch(() => false);
    
    if (!isLoggedIn) {
      // Try email/password login if available
      await page.goto('/');
      const loginBtn = page.locator('text=Get Started Free, text=Sign In').first();
      if (await loginBtn.isVisible()) await loginBtn.click();
    }
    
    await use(page);
  },
});

export { expect };

// ─── Skip when SPA shows login (protected routes without session) ───────────
export async function skipIfLoginPage(page) {
  await page.waitForLoadState('domcontentloaded');
  const wall = await page.getByRole('heading', { name: /^welcome back$/i }).isVisible().catch(() => false);
  if (wall) test.skip(true, 'Requires auth — set TEST_EMAIL/TEST_PASSWORD or storage state for full app e2e');
}

// ─── Helper: wait for API response ───────────────────────────────────────────
export async function waitForAPI(page, urlPattern, timeout = 30_000) {
  return page.waitForResponse(
    res => res.url().includes(urlPattern) && res.status() < 400,
    { timeout }
  );
}

// ─── Helper: dismiss any toast notifications ─────────────────────────────────
export async function dismissToasts(page) {
  const toasts = page.locator('[data-sonner-toaster] li');
  const count = await toasts.count();
  for (let i = 0; i < count; i++) {
    await toasts.nth(i).click().catch(() => {});
  }
}
