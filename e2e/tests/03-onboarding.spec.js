import { test, expect } from '../fixtures/helpers.js';

/** Quiz answers pre-fill health goal so onboarding opens on conditions (stable). */
async function openOnboardingWithQuizPrefill(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('vp_quiz', JSON.stringify({ concern: 'energy', diet: 'none' }));
  });
  await page.goto('/Onboarding');
}

test.describe('Onboarding flow', () => {

  test('onboarding page loads with correct design', async ({ page }) => {
    await openOnboardingWithQuizPrefill(page);
    await expect(page.getByText('VitaPlate').first()).toBeVisible();
    await expect(page.getByText(/Almost there — a few details|Let's build your biomarker-optimized nutrition plan/)).toBeVisible();
    await expect(page.locator('.rounded-full').first()).toBeVisible();
  });

  test('conditions step then allergens and budget', async ({ page }) => {
    await openOnboardingWithQuizPrefill(page);
    await expect(page.getByRole('heading', { name: /Any health conditions/i })).toBeVisible();

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: /Final details/i })).toBeVisible();
    await expect(page.getByText('Foods to avoid')).toBeVisible();

    await page.getByRole('button', { name: /nuts/i }).first().click();
    await page.getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: /You're all set/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Enter VitaPlate/i })).toBeVisible();
  });

  test('goal step appears when quiz is cleared', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.removeItem('vp_quiz'));
    await page.goto('/Onboarding');
    await expect(page.getByRole('heading', { name: /What's your primary health goal/i })).toBeVisible();
    await page.getByRole('button', { name: /General Wellness/i }).click();
    await expect(page.getByRole('heading', { name: /Any health conditions/i })).toBeVisible();
  });

  test('step indicator shows completed step after continue', async ({ page }) => {
    await openOnboardingWithQuizPrefill(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('.lucide-check').first()).toBeVisible();
  });
});
