import { test, expect } from '../fixtures/helpers.js';

test.describe('Landing page', () => {

  test('loads without auth — no redirect to login', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).not.toHaveURL(/login|auth|signin/);
    // Badge copy (appears once in hero; avoid strict-mode duplicate text matches)
    await expect(page.getByText(/meal plan built from your blood work/i).first()).toBeVisible();
  });

  test('headline and hero visual render', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText(/biomarker/i);
    await expect(page.getByText(/Answer 4 quick questions/i)).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('primary quiz CTA navigates to Quiz', async ({ page }) => {
    await page.goto('/');
    const primaryCTA = page.getByRole('link', { name: /Take the 60-second quiz/i });
    await expect(primaryCTA).toBeVisible();
    await primaryCTA.click();
    await expect(page).toHaveURL(/Quiz/);
  });

  test('footer quiz CTA navigates to Quiz', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Take the Free Quiz/i }).click();
    await expect(page).toHaveURL(/Quiz/);
  });

  test('Pricing link works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Pricing' }).first().click();
    await expect(page).toHaveURL(/Pricing/);
  });

  test('comparison table renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('columnheader', { name: 'MyFitnessPal' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Noom' })).toBeVisible();
    await expect(page.getByText('Reads your actual blood work')).toBeVisible();
  });

  test('How it works section visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /From blood panel to meal plan in 3 steps/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Upload your labs' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Get your plan' })).toBeVisible();
  });

  test('OG meta tags present', async ({ page }) => {
    await page.goto('/');
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toContain('VitaPlate');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toMatch(/lab|blood|biomarker/i);
  });

  test('page title is correct', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VitaPlate/);
  });

  test('mobile viewport renders without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
