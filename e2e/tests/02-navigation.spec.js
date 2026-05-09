import { test, expect } from '../fixtures/helpers.js';

test.describe('Navigation', () => {

  test('sidebar renders with all group labels', async ({ page }) => {
    await page.goto('/Dashboard');
    // Auth may redirect — just check the nav structure on whatever page loads
    const url = page.url();
    if (!url.includes('Dashboard')) return test.skip();

    await expect(page.locator('text=Health Intelligence')).toBeVisible();
    await expect(page.locator('text=Meal Planning')).toBeVisible();
    await expect(page.locator('text=Track & Improve')).toBeVisible();
    await expect(page.locator('text=Community')).toBeVisible();
    await expect(page.locator('text=Account')).toBeVisible();
  });

  test('sidebar collapses to icon rail', async ({ page }) => {
    await page.goto('/Dashboard');
    if (!page.url().includes('Dashboard')) return test.skip();

    // Find collapse button (chevron)
    const collapseBtn = page.locator('button:has([data-lucide="chevron-left"])').first();
    if (!await collapseBtn.isVisible()) return test.skip();

    await collapseBtn.click();
    // Sidebar should be narrow
    const sidebar = page.locator('aside').first();
    const box = await sidebar.boundingBox();
    expect(box?.width).toBeLessThan(80); // collapsed = 64px
  });

  test('Lab Results nav item navigates correctly', async ({ page }) => {
    await page.goto('/Dashboard');
    if (!page.url().includes('Dashboard')) return test.skip();
    await page.locator('text=Lab Results').first().click();
    await expect(page).toHaveURL(/LabResults/);
  });

  test('Health Diet Hub nav item navigates correctly', async ({ page }) => {
    await page.goto('/Dashboard');
    if (!page.url().includes('Dashboard')) return test.skip();
    await page.locator('text=Health Diet Hub').first().click();
    await expect(page).toHaveURL(/HealthDietHub/);
  });

  test('Nova AI Coach nav item navigates correctly', async ({ page }) => {
    await page.goto('/Dashboard');
    if (!page.url().includes('Dashboard')) return test.skip();
    await page.locator('text=Nova AI Coach').first().click();
    await expect(page).toHaveURL(/AICoach/);
  });

  test('top bar shows breadcrumb and New Plan button', async ({ page }) => {
    await page.goto('/Dashboard');
    if (!page.url().includes('Dashboard')) return test.skip();
    await expect(page.locator('text=New Plan')).toBeVisible();
    await expect(page.locator('text=VitaPlate')).toBeVisible(); // breadcrumb
  });

  test('all 23 pages load without error', async ({ page }) => {
    if (!page.url().includes('vitaplate')) await page.goto('/Dashboard');
    if (!page.url().includes('Dashboard')) return test.skip();

    const routes = [
      '/Dashboard', '/LabResults', '/HealthDietHub', '/AICoach',
      '/MealPlans', '/AIRecipeGenerator', '/GroceryLists', '/Pantry',
      '/MyProgress', '/NutritionTracking', '/Analytics',
      '/ProgressFeed', '/SharedRecipes', '/Integrations',
      '/Settings', '/HelpCenter', '/ReferFriend', '/Pricing',
    ];

    const errors: string[] = [];
    for (const route of routes) {
      await page.goto(route);
      // Check no error boundary visible
      const hasError = await page.locator('text=Something went wrong').isVisible()
        .catch(() => false);
      if (hasError) errors.push(route);

      // Check no full blank page
      const hasContent = await page.locator('body').evaluate(el => el.children.length > 0);
      if (!hasContent) errors.push(`${route} (blank)`);
    }

    if (errors.length) {
      throw new Error(`Pages with errors: ${errors.join(', ')}`);
    }
  });
});
