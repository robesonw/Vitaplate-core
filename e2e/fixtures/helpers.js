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
const AUTH_SKIP_MSG =
  'Requires auth — set TEST_EMAIL/TEST_PASSWORD or storage state for full app e2e';

export async function skipIfLoginPage(page) {
  await page.waitForLoadState('domcontentloaded');
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    const loginWall =
      (await page.locator('#signin-email').isVisible().catch(() => false))
      || (await page.getByRole('heading', { name: /^welcome back$/i }).isVisible().catch(() => false))
      || (await page.getByText('Welcome back', { exact: true }).isVisible().catch(() => false));
    if (loginWall) test.skip(true, AUTH_SKIP_MSG);

    const inApp =
      (await page.getByRole('button', { name: /open navigation menu/i }).isVisible().catch(() => false))
      || (await page.getByText('Health Intelligence', { exact: true }).isVisible().catch(() => false))
      || (await page.getByRole('heading', { name: /^Lab Results$/i }).isVisible().catch(() => false))
      || (await page.getByRole('heading', { name: /AI Recipe Generator/i }).isVisible().catch(() => false));
    if (inApp) return;

    await new Promise((r) => setTimeout(r, 120));
  }
}

/** Mobile layout hides the desktop sidebar; open the drawer before nav assertions / clicks. */
export async function openMobileNavIfNeeded(page, projectName) {
  if (projectName !== 'mobile') return;
  const menu = page.getByRole('button', { name: /open navigation menu/i });
  if (await menu.isVisible().catch(() => false)) {
    await menu.click();
    await page.getByText('Health Intelligence', { exact: true }).waitFor({ state: 'visible', timeout: 15_000 });
  }
}

/** Lab default tab may be Results when the user already has uploads — select Upload for upload-tab assertions. */
export async function goToLabUploadTab(page) {
  const tab = page.getByRole('tab', { name: /Upload Labs/i });
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
}

/** Ingredients field is a textarea below optional name input — target by placeholder for stable mobile fills. */
export async function fillAIRecipeIngredients(page, text) {
  const ta = page.getByPlaceholder(/e\.g\., chicken breast/i);
  await ta.scrollIntoViewIfNeeded();
  await ta.fill(text);
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
