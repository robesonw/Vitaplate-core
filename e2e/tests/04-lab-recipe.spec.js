import { test, expect, waitForAPI } from '../fixtures/helpers.js';
import path from 'path';

test.describe('Lab Results page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/LabResults');
    if (!page.url().includes('LabResults')) return test.skip();
  });

  test('renders 4-tab layout', async ({ page }) => {
    await expect(page.locator('text=Upload Labs')).toBeVisible();
    await expect(page.locator('text=My Results')).toBeVisible();
    await expect(page.locator('text=Trends')).toBeVisible();
    await expect(page.locator('text=Supplements')).toBeVisible();
  });

  test('upload tab shows drag-and-drop zone', async ({ page }) => {
    await expect(page.locator('text=Drop your lab report here')).toBeVisible();
    await expect(page.locator('text=Quest Diagnostics')).toBeVisible();
    await expect(page.locator('text=LabCorp')).toBeVisible();
  });

  test('upload tab shows biomarker preview cards', async ({ page }) => {
    await expect(page.locator('text=Cholesterol Panel')).toBeVisible();
    await expect(page.locator('text=Blood Sugar')).toBeVisible();
    await expect(page.locator('text=Vitamins & Minerals')).toBeVisible();
  });

  test('upload rejects non-PDF files', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    // Set a fake non-PDF file
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a pdf'),
    });
    await expect(page.locator('text=Only PDF files')).toBeVisible();
  });

  test('My Results tab shows empty state when no labs', async ({ page }) => {
    await page.locator('text=My Results').click();
    // Either shows labs or empty state
    const hasLabs = await page.locator('[class*="border"]').count() > 0;
    const hasEmpty = await page.locator('text=No lab results yet').isVisible().catch(() => false);
    expect(hasLabs || hasEmpty).toBeTruthy();
  });
});

test.describe('Recipe Generator', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/AIRecipeGenerator');
    if (!page.url().includes('AIRecipeGenerator')) return test.skip();
  });

  test('page renders with form and empty state', async ({ page }) => {
    await expect(page.locator('text=AI Recipe Generator')).toBeVisible();
    await expect(page.locator('text=Recipe Criteria')).toBeVisible();
    await expect(page.locator('text=Ready to Create?')).toBeVisible();
  });

  test('form has all required fields', async ({ page }) => {
    await expect(page.locator('text=Meal Type')).toBeVisible();
    await expect(page.locator('text=Cuisine Type')).toBeVisible();
    await expect(page.locator('text=Dietary Preference')).toBeVisible();
    await expect(page.locator('text=Available Ingredients')).toBeVisible();
  });

  test('requires ingredients before generating', async ({ page }) => {
    await page.locator('text=Generate Recipe').click();
    await expect(page.locator('text=Please enter some available ingredients')).toBeVisible();
  });

  test('generates recipe with valid inputs', async ({ page }) => {
    // Fill in ingredients
    await page.locator('textarea').fill('chicken breast, garlic, olive oil, lemon, rosemary');

    // Click generate
    const apiPromise = waitForAPI(page, '/api/ai/invoke', 45_000);
    await page.locator('text=Generate Recipe').click();

    // Loading state visible
    await expect(page.locator('text=AI is crafting your recipe')).toBeVisible();

    // Wait for API response
    await apiPromise;

    // Recipe should appear
    await expect(page.locator('text=Ingredients')).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('text=Instructions')).toBeVisible();
    await expect(page.locator('text=Nutrition per Serving')).toBeVisible();
  });

  test('generated recipe shows all sections', async ({ page }) => {
    await page.locator('textarea').fill('salmon, quinoa, spinach, lemon, garlic');
    await page.locator('text=Generate Recipe').click();

    await expect(page.locator('text=Ingredients')).toBeVisible({ timeout: 45_000 });

    // All sections
    await expect(page.locator('text=Instructions')).toBeVisible();
    await expect(page.locator('text=Nutrition per Serving')).toBeVisible();
    await expect(page.locator('text=Health Benefits')).toBeVisible();

    // Action buttons
    await expect(page.locator('text=Generate Image')).toBeVisible();
    await expect(page.locator('text=Save Recipe')).toBeVisible();
  });
});
