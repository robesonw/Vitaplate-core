import { test, expect } from '@playwright/test';
import {
  installE2EGuards,
  dismissBlockingOverlays,
} from '../fixtures/helpers.js';

// ─── Every route in the app ──────────────────────────────────────────────────
const PUBLIC_ROUTES = [
  '/',
  '/Pricing',
  '/Quiz',
  '/Onboarding',
  '/practitioners',
  '/corporate',
  '/refer/TESTCODE',
  '/scorecard/test-user-id',
];

const PROTECTED_ROUTES = [
  '/Dashboard',
  '/LabResults',
  '/HealthDietHub',
  '/AICoach',
  '/HealthAlerts',
  '/SupplementRecommendations',
  '/MealPlans',
  '/AIRecipeGenerator',
  '/RecipeImport',
  '/GroceryLists',
  '/Pantry',
  '/MyProgress',
  '/ProgressTracking',
  '/NutritionTracking',
  '/Analytics',
  '/ProgressFeed',
  '/SharedRecipes',
  '/SharedMealPlans',
  '/Community',
  '/Forum',
  '/FindPractitioner',
  '/PractitionerPortal',
  '/MyClients',
  '/PractitionerPricing',
  '/CorporateAdmin',
  '/AdminFeedback',
  '/AdminRecipeModeration',
  '/Profile',
  '/MyProfile',
  '/Integrations',
  '/ReferFriend',
  '/Settings',
  '/HelpCenter',
];

// Console errors that indicate a real render/runtime crash (not network noise).
const CRASH_PATTERNS =
  /Minified React error|not valid as a React child|Cannot read propert|is not a function|is not defined|Maximum update depth|Rendered fewer hooks|Objects are not valid/i;

function attachErrorCollectors(page) {
  const collected = { pageErrors: [], reactErrors: [] };
  page.on('pageerror', (err) => collected.pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (CRASH_PATTERNS.test(txt)) collected.reactErrors.push(txt);
    }
  });
  return collected;
}

async function assertPageHealthy(page, route) {
  await dismissBlockingOverlays(page).catch(() => {});

  // 1. No React error boundary.
  const errorBoundary = page.getByRole('heading', { name: /Something went wrong/i });
  const crashed = await errorBoundary.isVisible().catch(() => false);
  expect(crashed, `${route} crashed into the error boundary ("Something went wrong")`).toBe(false);

  // 2. 404 page should only appear for genuinely unknown routes.
  const notFound = await page.getByText(/page not found|404/i).first().isVisible().catch(() => false);
  expect(notFound, `${route} rendered a 404 / Page Not Found`).toBe(false);

  // 3. Body actually rendered something.
  const childCount = await page.locator('body').evaluate((el) => el.children.length);
  expect(childCount, `${route} rendered a blank body`).toBeGreaterThan(0);
}

test.describe('Auth — test user can log in', () => {
  test('authenticated session reaches the app (not the login wall)', async ({ page }) => {
    await installE2EGuards(page);
    await page.goto('/Dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const loginWall =
      (await page.locator('#signin-email').isVisible().catch(() => false)) ||
      (await page.getByRole('heading', { name: /^welcome back$/i }).isVisible().catch(() => false));

    expect(
      loginWall,
      'Login wall is showing — the stored session for the test user is invalid/expired. ' +
        'Check TEST_EMAIL/TEST_PASSWORD in e2e/.env and the Supabase user.',
    ).toBe(false);

    // Positive signal: we are inside the authenticated app. The sidebar nav, the mobile
    // nav button, or even a page-level error boundary all render ONLY after auth passes
    // (the error boundary lives inside ProtectedApp), so any of them confirms login worked.
    const dashboardNav = await page
      .getByRole('link', { name: /^Dashboard$/ })
      .first()
      .isVisible()
      .catch(() => false);
    const mobileNav = await page
      .getByRole('button', { name: /open navigation menu/i })
      .isVisible()
      .catch(() => false);
    const inAppErrorBoundary = await page
      .getByRole('button', { name: /Go to Dashboard/i })
      .isVisible()
      .catch(() => false);
    expect(
      dashboardNav || mobileNav || inAppErrorBoundary,
      'Authenticated app did not render for the test user (stuck before login)',
    ).toBe(true);
  });
});

test.describe('Public pages — render health', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`public ${route} renders without crashing`, async ({ page }) => {
      const errors = attachErrorCollectors(page);
      await installE2EGuards(page);
      const res = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(res?.status() ?? 200, `${route} returned HTTP ${res?.status()}`).toBeLessThan(400);
      await page.waitForTimeout(1500);

      const errorBoundary = page.getByRole('heading', { name: /Something went wrong/i });
      const crashed = await errorBoundary.isVisible().catch(() => false);
      expect(crashed, `${route} crashed into the error boundary`).toBe(false);

      expect(
        errors.pageErrors,
        `${route} threw uncaught JS errors:\n${errors.pageErrors.join('\n')}`,
      ).toHaveLength(0);
      expect(
        errors.reactErrors,
        `${route} logged React crash errors:\n${errors.reactErrors.join('\n')}`,
      ).toHaveLength(0);
    });
  }
});

test.describe('Protected pages — render health (authenticated)', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`protected ${route} renders without crashing`, async ({ page }) => {
      const errors = attachErrorCollectors(page);
      await installE2EGuards(page);
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      // Give the SPA + data queries time to resolve.
      await page.waitForTimeout(3000);

      await assertPageHealthy(page, route);

      expect(
        errors.pageErrors,
        `${route} threw uncaught JS errors:\n${errors.pageErrors.join('\n')}`,
      ).toHaveLength(0);
      expect(
        errors.reactErrors,
        `${route} logged React crash errors:\n${errors.reactErrors.join('\n')}`,
      ).toHaveLength(0);
    });
  }
});
