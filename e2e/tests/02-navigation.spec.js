import {
  test,
  expect,
  skipIfLoginPage,
  openMobileNavIfNeeded,
  installE2EGuards,
  dismissBlockingOverlays,
  appSidebar,
} from '../fixtures/helpers.js';

test.describe('Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await installE2EGuards(page);
  });

  test('sidebar renders with all group labels', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await dismissBlockingOverlays(page);
    await openMobileNavIfNeeded(page, test.info().project.name);
    const nav = appSidebar(page, test.info().project.name);
    await expect(nav.getByText('Health Intelligence', { exact: true })).toBeVisible();
    await expect(nav.getByText('Meal Planning', { exact: true })).toBeVisible();
    await expect(nav.getByText('Track & Improve', { exact: true })).toBeVisible();
    await expect(nav.getByText('Community', { exact: true })).toBeVisible();
    await expect(nav.getByText('Account', { exact: true })).toBeVisible();
  });

  test('sidebar collapses to icon rail', async ({ page }) => {
    if (test.info().project.name === 'mobile') {
      test.skip(true, 'Collapse control is desktop-only (hidden below lg breakpoint)');
    }
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await dismissBlockingOverlays(page);
    const desktopSidebar = page.locator('aside').first();
    const collapseBtn = desktopSidebar.getByRole('button', { name: /collapse sidebar/i });
    if (!await collapseBtn.isVisible().catch(() => false)) test.skip(true, 'Collapse control not visible (viewport)');
    await collapseBtn.click();
    await expect(page.getByRole('button', { name: /expand sidebar/i })).toBeVisible({ timeout: 10_000 });
    await expect(desktopSidebar).toHaveClass(/w-16/);
  });

  test('Lab Results nav item navigates correctly', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await dismissBlockingOverlays(page);
    await openMobileNavIfNeeded(page, test.info().project.name);
    const labLink = appSidebar(page, test.info().project.name).getByRole('link', { name: /Lab Results/ });
    if (test.info().project.name === 'mobile') {
      await labLink.evaluate((el) => el.click());
    } else {
      await labLink.click();
    }
    await expect(page).toHaveURL(/LabResults/);
  });

  test('Health Diet Hub nav item navigates correctly', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await dismissBlockingOverlays(page);
    await openMobileNavIfNeeded(page, test.info().project.name);
    const hubLink = appSidebar(page, test.info().project.name).getByRole('link', { name: /Health Diet Hub/ });
    if (test.info().project.name === 'mobile') {
      await hubLink.evaluate((el) => el.click());
    } else {
      await hubLink.click();
    }
    await expect(page).toHaveURL(/HealthDietHub/);
  });

  test('Nova AI Coach nav item navigates correctly', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await dismissBlockingOverlays(page);
    await openMobileNavIfNeeded(page, test.info().project.name);
    const coachLink = appSidebar(page, test.info().project.name).getByRole('link', { name: /Nova AI Coach/ });
    if (test.info().project.name === 'mobile') {
      await coachLink.evaluate((el) => el.click());
    } else {
      await coachLink.click();
    }
    await expect(page).toHaveURL(/AICoach/);
  });

  test('top bar shows breadcrumb and New Plan button', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await dismissBlockingOverlays(page);
    if (test.info().project.name === 'mobile') {
      await expect(page.getByRole('button', { name: /open navigation menu/i })).toBeVisible();
      return;
    }
    await expect(page.getByText('New Plan', { exact: true })).toBeVisible();
    await expect(page.getByText('VitaPlate', { exact: true }).first()).toBeVisible();
  });

  test('core app routes load without error boundary', async ({ page }) => {
    await page.goto('/Dashboard', { waitUntil: 'domcontentloaded' });

    const routes = [
      '/Dashboard', '/LabResults', '/HealthDietHub', '/AICoach',
      '/MealPlans', '/AIRecipeGenerator', '/GroceryLists', '/Pantry',
      '/MyProgress', '/NutritionTracking', '/Analytics',
      '/ProgressFeed', '/SharedRecipes', '/Integrations',
      '/Settings', '/HelpCenter', '/ReferFriend', '/Pricing',
    ];

    const errors = [];
    for (const route of routes) {
      await page.goto(route);
      const hasError = await page.locator('text=Something went wrong').isVisible().catch(() => false);
      if (hasError) errors.push(route);
      const hasContent = await page.locator('body').evaluate(el => el.children.length > 0);
      if (!hasContent) errors.push(`${route} (blank)`);
    }

    if (errors.length) {
      throw new Error(`Pages with errors: ${errors.join(', ')}`);
    }
  });
});
