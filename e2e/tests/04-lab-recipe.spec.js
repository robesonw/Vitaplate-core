import { test, expect, skipIfLoginPage, goToLabUploadTab, fillAIRecipeIngredients } from '../fixtures/helpers.js';

test.describe('Lab Results page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/LabResults');
    await skipIfLoginPage(page);
  });

  test('renders 4-tab layout', async ({ page }) => {
    await page.getByRole('tablist').scrollIntoViewIfNeeded();
    await expect(page.getByRole('tab', { name: /Upload Labs/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /My Results/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Trends/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Supplements/i })).toBeVisible();
  });

  test('upload tab shows drag-and-drop zone', async ({ page }) => {
    await goToLabUploadTab(page);
    await expect(page.getByText('Drop your lab report here')).toBeVisible();
    await expect(page.getByText('Quest Diagnostics')).toBeVisible();
    await expect(page.getByText('LabCorp')).toBeVisible();
  });

  test('upload tab shows biomarker preview cards', async ({ page }) => {
    await goToLabUploadTab(page);
    await expect(page.getByText('Cholesterol Panel')).toBeVisible();
    await expect(page.getByText('Blood Sugar')).toBeVisible();
    await expect(page.getByText('Vitamins & Minerals')).toBeVisible();
  });

  test('upload rejects non-PDF files', async ({ page }) => {
    await goToLabUploadTab(page);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a pdf'),
    });
    await expect(page.getByText(/PDF/i)).toBeVisible();
  });

  test('My Results tab shows empty state when no labs', async ({ page }) => {
    await page.getByRole('tablist').scrollIntoViewIfNeeded();
    await page.getByRole('tab', { name: /My Results/i }).click();
    const hasEmpty = await page.getByText('No lab results yet').isVisible().catch(() => false);
    const hasList = await page.locator('[class*="border-indigo-500"]').count() > 0;
    expect(hasEmpty || hasList).toBeTruthy();
  });
});

test.describe('Recipe Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/AIRecipeGenerator');
    await skipIfLoginPage(page);
  });

  test('page renders with form and empty state', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /AI Recipe Generator/i })).toBeVisible();
    await expect(page.getByText('Recipe Criteria')).toBeVisible();
    await expect(page.getByText('Ready to Create?')).toBeVisible();
  });

  test('form has all required fields', async ({ page }) => {
    await expect(page.getByText('Meal Type', { exact: true })).toBeVisible();
    await expect(page.getByText('Cuisine Type', { exact: true })).toBeVisible();
    await expect(page.getByText('Dietary Preference', { exact: true })).toBeVisible();
    await expect(page.getByText('Available Ingredients', { exact: true })).toBeVisible();
  });

  test('requires ingredients before generating', async ({ page }) => {
    await page.getByRole('button', { name: /Generate Recipe/i }).click();
    await expect(page.getByText('Please enter some available ingredients')).toBeVisible();
  });

  test('generates recipe with valid inputs', async ({ page }) => {
    test.slow();
    await fillAIRecipeIngredients(page, 'chicken breast, garlic, olive oil, lemon, rosemary');
    await page.getByRole('button', { name: /Generate Recipe/i }).click();

    await expect(page.getByText(/AI is crafting your recipe/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /^Ingredients$/i })).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole('heading', { name: /^Instructions$/i })).toBeVisible();
    await expect(page.getByText('Nutrition per Serving')).toBeVisible();
  });

  test('generated recipe shows all sections', async ({ page }) => {
    test.slow();
    await fillAIRecipeIngredients(page, 'salmon, quinoa, spinach, lemon, garlic');
    await page.getByRole('button', { name: /Generate Recipe/i }).click();

    await expect(page.getByRole('heading', { name: /^Ingredients$/i })).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole('heading', { name: /^Instructions$/i })).toBeVisible();
    await expect(page.getByText('Nutrition per Serving')).toBeVisible();
    await expect(page.getByText(/Health Benefits|health benefits/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate Image/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Recipe/i })).toBeVisible();
  });
});
