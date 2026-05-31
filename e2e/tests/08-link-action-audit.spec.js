import { test, expect } from '@playwright/test';
import {
  installE2EGuards,
  skipIfLoginPage,
  dismissBlockingOverlays,
} from '../fixtures/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// Launch-readiness audit.
//   1. Crawl every page and verify EVERY internal link resolves to a real page
//      (no 404 / PageNotFound, no error boundary).
//   2. On every page, exercise safe interactive controls (tabs, menus, dialogs)
//      and confirm none crash the app or trigger 5xx server errors.
// ─────────────────────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = ['/', '/Pricing', '/Quiz', '/practitioners', '/corporate'];

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

const CRASH_PATTERNS =
  /Minified React error|not valid as a React child|Cannot read propert|is not a function|is not defined|Maximum update depth|Rendered fewer hooks|Objects are not valid/i;

// Thrown app messages that are correct product behavior, not crashes.
const EXPECTED_NON_CRASH = /free messages|Upgrade to Pro|rate limit|too many requests|quota/i;

// Never click these on a real account.
const DESTRUCTIVE_LABEL =
  /sign ?out|log ?out|delete|remove|disconnect|revoke|unsubscribe|cancel|clear|reset|deactivate|pay|checkout|upgrade|subscribe|purchase|buy|confirm|save|send|generate|create|continue|publish|post|share|invite|export|import|upload|apply|connect|sync|enable|disable/i;

function attachErrorCollectors(page) {
  const collected = { pageErrors: [], reactErrors: [], serverErrors: [] };
  page.on('pageerror', (err) => {
    if (!EXPECTED_NON_CRASH.test(err.message)) collected.pageErrors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error' && CRASH_PATTERNS.test(msg.text())) collected.reactErrors.push(msg.text());
  });
  page.on('response', (res) => {
    if (res.status() >= 500) collected.serverErrors.push(`${res.status()} ${res.request().method()} ${res.url()}`);
  });
  return collected;
}

async function hasCrashed(page) {
  return page
    .getByRole('heading', { name: /Something went wrong/i })
    .isVisible()
    .catch(() => false);
}

async function isNotFound(page) {
  return page
    .getByText(/page not found|404/i)
    .first()
    .isVisible()
    .catch(() => false);
}

/** Normalize an href to an in-app pathname, or null if it is not an internal route. */
function toInternalPath(href) {
  if (!href) return null;
  const trimmed = href.trim();
  if (
    trimmed === '' ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('javascript:')
  ) {
    return null;
  }
  // Absolute URL — only treat as internal when it points at our own host.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (!/vitaplate\.ai$/i.test(u.hostname)) return null;
      return u.pathname || '/';
    } catch {
      return null;
    }
  }
  if (!trimmed.startsWith('/')) return null;
  return trimmed.split('#')[0].split('?')[0] || '/';
}

test.describe('Launch audit — link integrity', () => {
  test('every internal link across the app resolves to a real page', async ({ page }) => {
    test.setTimeout(600_000);
    await installE2EGuards(page);

    // ── Phase 1: crawl every page and collect internal links ──────────────────
    const linkSources = new Map(); // pathname -> Set(pages where the link appears)
    const allPages = [...PUBLIC_ROUTES, ...PROTECTED_ROUTES];

    for (const route of allPages) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      if (PROTECTED_ROUTES.includes(route)) await skipIfLoginPage(page);
      await page.waitForTimeout(1200);
      await dismissBlockingOverlays(page).catch(() => {});

      const hrefs = await page.$$eval('a[href]', (els) => els.map((e) => e.getAttribute('href')));
      for (const href of hrefs) {
        const pathname = toInternalPath(href);
        if (!pathname) continue;
        if (!linkSources.has(pathname)) linkSources.set(pathname, new Set());
        linkSources.get(pathname).add(route);
      }
    }

    // ── Phase 2: visit each unique internal link and verify it resolves ────────
    const broken = [];
    for (const [pathname, sources] of [...linkSources.entries()].sort()) {
      const res = await page.goto(pathname, { waitUntil: 'domcontentloaded' }).catch(() => null);
      await page.waitForTimeout(1000);

      const httpStatus = res?.status() ?? 0;
      const notFound = await isNotFound(page);
      const crashed = await hasCrashed(page);

      if (httpStatus >= 400 || notFound || crashed) {
        broken.push(
          `${pathname}  [HTTP ${httpStatus}${notFound ? ', 404 page' : ''}${crashed ? ', crashed' : ''}]  ` +
            `← linked from: ${[...sources].join(', ')}`,
        );
      }
    }

    expect(
      broken,
      `\nFound ${broken.length} broken internal link(s):\n` + broken.map((b) => `  • ${b}`).join('\n') + '\n',
    ).toEqual([]);
  });
});

test.describe('Launch audit — safe interactive controls', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`controls on ${route} open without crashing or server errors`, async ({ page }) => {
      test.setTimeout(75_000);
      const errors = attachErrorCollectors(page);
      await installE2EGuards(page);
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await skipIfLoginPage(page);
      await page.waitForTimeout(1500);
      await dismissBlockingOverlays(page).catch(() => {});

      // Only exercise in-place controls that never navigate or mutate data:
      //   • tabs           — frequent source of lazy-render crashes
      //   • popup triggers  — menus / dialogs that render overlays in place
      // (Navigation links are validated exhaustively by the link-integrity crawl.)
      const clickGuarded = async (locator, desc) => {
        await locator.click({ force: true, timeout: 2500, noWaitAfter: true }).catch(() => {});
        await page.waitForTimeout(350);
        expect(await hasCrashed(page), `${route}: ${desc} crashed the app`).toBe(false);
      };

      // Tabs
      const tabs = page.getByRole('tab');
      const tabCount = await tabs.count().catch(() => 0);
      for (let i = 0; i < tabCount; i++) {
        await clickGuarded(tabs.nth(i), `tab #${i}`);
      }

      // Popup / dialog / menu triggers, bounded by an interaction time budget.
      const deadline = Date.now() + 35_000;
      const triggers = page.locator(
        'button[aria-haspopup], [role="button"][aria-haspopup], button[data-state="closed"]',
      );
      const trigCount = Math.min(await triggers.count().catch(() => 0), 16);
      for (let i = 0; i < trigCount && Date.now() < deadline; i++) {
        const trigger = triggers.nth(i);
        if (!(await trigger.isVisible().catch(() => false))) continue;
        const label = ((await trigger.getAttribute('aria-label').catch(() => '')) ||
          (await trigger.innerText().catch(() => '')) || `trigger #${i}`)
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 40);
        if (DESTRUCTIVE_LABEL.test(label)) continue;
        await clickGuarded(trigger, `popup "${label}"`);
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(120);
      }

      expect(await hasCrashed(page), `${route} crashed during the action audit`).toBe(false);
      expect(
        errors.pageErrors,
        `${route} threw uncaught JS errors during actions:\n${errors.pageErrors.join('\n')}`,
      ).toHaveLength(0);
      expect(
        errors.reactErrors,
        `${route} logged React crash errors during actions:\n${errors.reactErrors.join('\n')}`,
      ).toHaveLength(0);
      expect(
        errors.serverErrors,
        `${route} triggered server (5xx) errors:\n${errors.serverErrors.join('\n')}`,
      ).toHaveLength(0);
    });
  }
});
