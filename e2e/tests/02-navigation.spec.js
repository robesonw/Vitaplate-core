import { test, expect, skipIfLoginPage } from '../fixtures/helpers.js';

test.describe('Navigation', () => {

  test('sidebar renders with all group labels', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await expect(page.getByText('Health Intelligence', { exact: true })).toBeVisible();
    await expect(page.getByText('Meal Planning', { exact: true })).toBeVisible();
    await expect(page.getByText('Track & Improve', { exact: true })).toBeVisible();
    await expect(page.getByText('Community', { exact: true })).toBeVisible();
    await expect(page.getByText('Account', { exact: true })).toBeVisible();
  });

  test('sidebar collapses to icon rail', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    const collapseBtn = page.getByRole('button', { name: /collapse sidebar/i });
    if (!await collapseBtn.isVisible().catch(() => false)) test.skip(true, 'Collapse control not visible (viewport)');
    await collapseBtn.click();
    const sidebar = page.locator('aside').first();
    const box = await sidebar.boundingBox();
    expect(box?.width).toBeLessThan(80);
  });

  test('Lab Results nav item navigates correctly', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await page.getByRole('link', { name: /Lab Results/ }).first().click();
    await expect(page).toHaveURL(/LabResults/);
  });

  test('Health Diet Hub nav item navigates correctly', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await page.getByRole('link', { name: /Health Diet Hub/ }).first().click();
    await expect(page).toHaveURL(/HealthDietHub/);
  });

  test('Nova AI Coach nav item navigates correctly', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await page.getByRole('link', { name: /Nova AI Coach/ }).first().click();
    await expect(page).toHaveURL(/AICoach/);
  });

  test('top bar shows breadcrumb and New Plan button', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);
    await expect(page.getByText('New Plan', { exact: true })).toBeVisible();
    await expect(page.getByText('VitaPlate', { exact: true }).first()).toBeVisible();
  });

  test('core app routes load without error boundary', async ({ page }) => {
    await page.goto('/Dashboard');
    await skipIfLoginPage(page);

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
