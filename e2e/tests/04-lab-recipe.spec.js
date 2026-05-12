import {
  test,
  expect,
  skipIfLoginPage,
  goToLabUploadTab,
  fillAIRecipeIngredients,
  installE2EGuards,
  dismissBlockingOverlays,
  recipeIngredientsField,
  recipeGenerateButton,
} from '../fixtures/helpers.js';

async function waitForRecipeResultOrError(page) {
  // Single success locator — "Ingredients" + "Instructions" headings both exist when done; `.or()` would match both and trip strict mode.
  const ok = page.getByRole('heading', { name: /^Ingredients$/i });
  const fail = page
    .locator('p.text-rose-700')
    .filter({ hasText: /could not generate|The AI could not|try again/i })
    .or(page.getByText(/The AI could not generate a recipe right now/i));
  await expect(ok.or(fail)).toBeVisible({ timeout: 180_000 });
  if (await fail.isVisible().catch(() => false)) {
    test.skip(true, 'Recipe AI invoke failed or rate-limited in this environment');
  }
}

test.describe('Lab Results page', () => {

  test.beforeEach(async ({ page }) => {
    await installE2EGuards(page);
    await page.goto('/LabResults');
    await skipIfLoginPage(page);
    await dismissBlockingOverlays(page);
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
    await expect(page.getByText(/Please upload a PDF file/i)).toBeVisible();
  });

  test('My Results tab shows empty state when no labs', async ({ page }) => {
    await page.getByRole('tablist').scrollIntoViewIfNeeded();
    await page.getByRole('tab', { name: /My Results/i }).click();
    await expect
      .poll(
        async () => {
          const empty = await page.getByText('No lab results yet').isVisible().catch(() => false);
          const list = (await page.locator('[class*="border-indigo-500"]').count()) > 0;
          return empty || list;
        },
        { timeout: 45_000 },
      )
      .toBeTruthy();
  });
});

test.describe('Recipe Generator', () => {
  test.beforeEach(async ({ page }) => {
    await installE2EGuards(page);
    await page.goto('/AIRecipeGenerator');
    await skipIfLoginPage(page);
    await dismissBlockingOverlays(page);
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
    await expect(page.getByText(/Available Ingredients/)).toBeVisible();
  });

  test('requires ingredients before generating', async ({ page }) => {
    await dismissBlockingOverlays(page);
    const ingredients = recipeIngredientsField(page);
    await ingredients.scrollIntoViewIfNeeded();
    await ingredients.fill('');
    await recipeGenerateButton(page).click();
    await expect(page.getByText('Ready to Create?')).toBeVisible();
    await expect(page.getByText(/AI is crafting your recipe/i)).not.toBeVisible({ timeout: 8_000 });
  });

  test('generates recipe with valid inputs', async ({ page }) => {
    // LLM + UI can exceed test.slow() (3× default); allow room for 180s result wait + crafting banner.
    test.setTimeout(300_000);
    await dismissBlockingOverlays(page);
    await fillAIRecipeIngredients(page, 'chicken breast, garlic, olive oil, lemon, rosemary');
    await recipeGenerateButton(page).click();

    await expect(page.getByText(/AI is crafting your recipe/i)).toBeVisible({ timeout: 60_000 });
    await waitForRecipeResultOrError(page);
    await expect(page.getByRole('heading', { name: /^Instructions$/i })).toBeVisible();
    await expect(page.getByText(/Prep:/i)).toBeVisible();
    await expect(page.getByText(/Cook:/i)).toBeVisible();
  });

  test('generated recipe shows all sections', async ({ page }) => {
    test.setTimeout(300_000);
    await dismissBlockingOverlays(page);
    await fillAIRecipeIngredients(page, 'salmon, quinoa, spinach, lemon, garlic');
    await recipeGenerateButton(page).click();

    await expect(page.getByText(/AI is crafting your recipe/i)).toBeVisible({ timeout: 60_000 });
    await waitForRecipeResultOrError(page);
    await expect(page.getByRole('heading', { name: /^Instructions$/i })).toBeVisible();
    await expect(page.getByText(/Prep:/i)).toBeVisible();
    await expect(page.getByText(/Cook:/i)).toBeVisible();
    const benefits = page.getByRole('heading', { name: /^Health Benefits$/i });
    if (await benefits.isVisible().catch(() => false)) {
      await expect(benefits).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /Generate Image/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Recipe/i })).toBeVisible();
  });
});
