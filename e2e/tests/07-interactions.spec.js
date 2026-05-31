import { test, expect } from '@playwright/test';
import {
  installE2EGuards,
  skipIfLoginPage,
  dismissBlockingOverlays,
} from '../fixtures/helpers.js';

const CRASH_PATTERNS =
  /Minified React error|not valid as a React child|Cannot read propert|is not a function|is not defined|Maximum update depth|Rendered fewer hooks|Objects are not valid/i;

// Expected, non-crash app messages (paywalls, rate limits) that surface as
// thrown errors but are correct product behavior — never treat as failures.
const EXPECTED_NON_CRASH =
  /free messages|Upgrade to Pro|rate limit|too many requests|quota/i;

function attachErrorCollectors(page) {
  const collected = { pageErrors: [], reactErrors: [] };
  page.on('pageerror', (err) => {
    if (!EXPECTED_NON_CRASH.test(err.message)) collected.pageErrors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error' && CRASH_PATTERNS.test(msg.text())) collected.reactErrors.push(msg.text());
  });
  return collected;
}

async function expectNoCrash(page, context, errors) {
  const crashed = await page
    .getByRole('heading', { name: /Something went wrong/i })
    .isVisible()
    .catch(() => false);
  expect(crashed, `${context} crashed into the error boundary`).toBe(false);
  expect(errors.pageErrors, `${context} threw JS errors:\n${errors.pageErrors.join('\n')}`).toHaveLength(0);
  expect(errors.reactErrors, `${context} logged React errors:\n${errors.reactErrors.join('\n')}`).toHaveLength(0);
}

// Pages that use a tab interface — clicking every tab is a safe, non-destructive action
// that frequently surfaces render crashes in lazily-rendered sub-views.
const TABBED_PAGES = [
  '/LabResults',
  '/HealthDietHub',
  '/Analytics',
  '/MyProgress',
  '/NutritionTracking',
  '/Settings',
  '/Integrations',
  '/Community',
  '/PractitionerPortal',
];

test.describe('Tab interactions across pages', () => {
  for (const route of TABBED_PAGES) {
    test(`every tab on ${route} opens without crashing`, async ({ page }) => {
      const errors = attachErrorCollectors(page);
      await installE2EGuards(page);
      await page.goto(route);
      await skipIfLoginPage(page);
      await dismissBlockingOverlays(page);
      await page.waitForTimeout(1500);

      const tabs = page.getByRole('tab');
      const count = await tabs.count();
      if (count === 0) {
        test.skip(true, `${route} has no tab interface`);
      }

      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        const label = (await tab.innerText().catch(() => `tab ${i}`)).replace(/\s+/g, ' ').trim();
        await tab.click({ force: true }).catch(() => {});
        await page.waitForTimeout(800);
        await expectNoCrash(page, `${route} → tab "${label}"`, errors);
      }
    });
  }
});

test.describe('Nova AI Coach — chat action', () => {
  test('sends a message and gets a response (no crash)', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = attachErrorCollectors(page);
    await installE2EGuards(page);
    await page.goto('/AICoach');
    await skipIfLoginPage(page);
    await dismissBlockingOverlays(page);

    const input = page
      .getByPlaceholder(/ask|message|type|nova/i)
      .or(page.locator('textarea'))
      .or(page.locator('input[type="text"]'))
      .first();

    const visible = await input.isVisible().catch(() => false);
    if (!visible) test.skip(true, 'Coach input not found on this build');

    await input.fill('What is a good high-protein breakfast?');

    const sendBtn = page
      .getByRole('button', { name: /send/i })
      .or(page.locator('button[type="submit"]'))
      .first();
    if (await sendBtn.isVisible().catch(() => false)) {
      await sendBtn.click();
    } else {
      await input.press('Enter');
    }

    // Wait for an assistant reply or a graceful error — but never a crash.
    await page.waitForTimeout(20_000);
    await expectNoCrash(page, '/AICoach chat', errors);
  });
});

test.describe('Notification bell', () => {
  test('opening the notification bell does not crash the app', async ({ page }) => {
    const errors = attachErrorCollectors(page);
    await installE2EGuards(page);
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await dismissBlockingOverlays(page);
    await page.waitForTimeout(1500);

    const bell = page.locator('button:has(.lucide-bell)').first();
    if (!(await bell.isVisible().catch(() => false))) {
      test.skip(true, 'Notification bell not found in this build');
    }
    await bell.click();
    await page.waitForTimeout(2000);
    await expectNoCrash(page, 'Notification bell (opened)', errors);
  });
});

test.describe('Dashboard quick actions', () => {
  test('quick-action links navigate without crashing', async ({ page }) => {
    const errors = attachErrorCollectors(page);
    await installE2EGuards(page);
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await dismissBlockingOverlays(page);

    // "New Plan" header button → Health Diet Hub
    const newPlan = page.getByRole('link', { name: /New Plan/i }).first();
    if (await newPlan.isVisible().catch(() => false)) {
      await newPlan.click();
      await page.waitForTimeout(1500);
      await expectNoCrash(page, 'Dashboard → New Plan', errors);
    }
  });
});
