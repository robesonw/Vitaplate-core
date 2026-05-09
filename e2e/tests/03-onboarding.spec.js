import { test, expect } from '../fixtures/helpers.js';

test.describe('Onboarding flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/Onboarding');
  });

  test('onboarding page loads with correct design', async ({ page }) => {
    await expect(page.locator('text=VitaPlate')).toBeVisible();
    await expect(page.locator("text=Let's build your biomarker-optimized nutrition plan")).toBeVisible();
    // Step dots visible
    await expect(page.locator('.rounded-full').first()).toBeVisible();
  });

  test('step 1 — health goal selection', async ({ page }) => {
    // Should show health goals
    await expect(page.locator('text=What\'s your primary health goal?')).toBeVisible();

    // All goal options visible
    await expect(page.locator('text=Weight Loss')).toBeVisible();
    await expect(page.locator('text=Blood Sugar')).toBeVisible();
    await expect(page.locator('text=Heart Health')).toBeVisible();
    await expect(page.locator('text=General Wellness')).toBeVisible();

    // Continue disabled before selection
    const continueBtn = page.locator('text=Continue');
    await expect(continueBtn).toBeDisabled();

    // Select a goal
    await page.locator('text=General Wellness').click();
    await expect(continueBtn).toBeEnabled();
  });

  test('step 2 — conditions selection', async ({ page }) => {
    // Complete step 1
    await page.locator('text=General Wellness').click();
    await page.locator('text=Continue').click();

    await expect(page.locator('text=Any health conditions?')).toBeVisible();
    await expect(page.locator('text=Diabetes / Prediabetes')).toBeVisible();
    await expect(page.locator('text=Heart Condition')).toBeVisible();

    // Can skip (optional step)
    await page.locator('text=Continue').click();
    await expect(page.locator('text=Diet preferences')).toBeVisible();
  });

  test('step 3 — diet and allergens', async ({ page }) => {
    await page.locator('text=General Wellness').click();
    await page.locator('text=Continue').click();
    await page.locator('text=Continue').click();

    await expect(page.locator('text=Diet preferences & allergens')).toBeVisible();
    await expect(page.locator('text=Vegetarian')).toBeVisible();
    await expect(page.locator('text=nuts')).toBeVisible();

    // Select allergen
    await page.locator('text=nuts').click();
    await page.locator('text=Continue').click();
  });

  test('step 4 — budget and servings', async ({ page }) => {
    // Skip through steps 1-3
    await page.locator('text=General Wellness').click();
    await page.locator('text=Continue').click();
    await page.locator('text=Continue').click();
    await page.locator('text=Continue').click();

    await expect(page.locator('text=Budget & serving size')).toBeVisible();
    await expect(page.locator('input[type="range"]')).toBeVisible();

    // Change servings
    await page.locator('button:has-text("2")').click();
    await page.locator('text=Continue').click();
  });

  test('step 5 — generate plan screen', async ({ page }) => {
    // Navigate to final step
    await page.locator('text=General Wellness').click();
    await page.locator('text=Continue').click();
    await page.locator('text=Continue').click();
    await page.locator('text=Continue').click();
    await page.locator('text=Continue').click();

    await expect(page.locator('text=Ready to generate your plan!')).toBeVisible();
    await expect(page.locator('text=Generate My Meal Plan')).toBeVisible();
    await expect(page.locator('text=You can refine everything')).toBeVisible();
  });

  test('step indicator progresses correctly', async ({ page }) => {
    // Check step dots — first is active
    const dots = page.locator('.rounded-full');
    const firstDot = dots.first();
    await expect(firstDot).toBeVisible();

    await page.locator('text=General Wellness').click();
    await page.locator('text=Continue').click();
    // Step 2 now active — check checkmark on step 1
    await expect(page.locator('[data-lucide="check"]').first()).toBeVisible();
  });
});
