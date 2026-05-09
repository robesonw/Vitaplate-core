import { test, expect, BASE_URL } from '../fixtures/helpers.js';

test.describe('Landing page', () => {

  test('loads without auth — no redirect to login', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    // Should NOT be on a login page
    await expect(page).not.toHaveURL(/login|auth|signin/);
    await expect(page.locator('text=Your blood work')).toBeVisible();
  });

  test('headline and hero visual render', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('blood work');
    await expect(page.locator('text=becomes your meal plan')).toBeVisible();
    // Hero visual SVG
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('CTA buttons are present and functional', async ({ page }) => {
    await page.goto('/');
    const primaryCTA = page.locator('text=Get My Personalized Plan Free');
    await expect(primaryCTA).toBeVisible();
    await primaryCTA.click();
    await expect(page).toHaveURL(/Onboarding/);
  });

  test('Upload Lab Results CTA navigates correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('text=Upload Lab Results').click();
    // May redirect to login or LabResults depending on auth state
    await expect(page).toHaveURL(/LabResults|login|auth/);
  });

  test('Pricing link works', async ({ page }) => {
    await page.goto('/');
    await page.locator('text=Pricing').first().click();
    await expect(page).toHaveURL(/Pricing/);
  });

  test('comparison table renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=MyFitnessPal')).toBeVisible();
    await expect(page.locator('text=Noom')).toBeVisible();
    await expect(page.locator('text=Reads your actual lab results')).toBeVisible();
  });

  test('How it works section visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=How it works')).toBeVisible();
    await expect(page.locator('text=Upload your labs')).toBeVisible();
    await expect(page.locator('text=Get your meal plan')).toBeVisible();
  });

  test('OG meta tags present', async ({ page }) => {
    await page.goto('/');
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toContain('VitaPlate');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('lab');
  });

  test('page title is correct', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VitaPlate/);
  });

  test('mobile viewport renders without horizontal scroll', async ({ page, isMobile }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    const scrollWidth  = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth  = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });
});
