/**
 * Logs in with email/password (from env) and saves storage for all tests.
 * Copy e2e/.env.example → e2e/.env and set TEST_EMAIL / TEST_PASSWORD
 * (must match a Supabase user with Email provider + confirmed email).
 */
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadEnv() {
  try {
    const dotenv = await import('dotenv');
    dotenv.config({ path: path.join(__dirname, '.env') });
  } catch {
    /* optional */
  }
}

export default async function globalSetup() {
  await loadEnv();

  const email = process.env.TEST_EMAIL?.trim();
  const password = process.env.TEST_PASSWORD?.trim();
  const baseURL = (process.env.BASE_URL || 'https://www.vitaplate.ai').replace(/\/$/, '');

  const authDir = path.join(__dirname, '.auth');
  const authFile = path.join(authDir, 'user.json');

  if (!email || !password) {
    if (fs.existsSync(authFile)) fs.unlinkSync(authFile);
    // eslint-disable-next-line no-console
    console.log('[e2e global-setup] No TEST_EMAIL/TEST_PASSWORD — skipped');
    return;
  }

  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto('/Dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 });

  const loginWall = await page.getByRole('heading', { name: /^welcome back$/i }).isVisible().catch(() => false);
  if (!loginWall) {
    await context.storageState({ path: authFile });
    await browser.close();
    // eslint-disable-next-line no-console
    console.log('[e2e global-setup] No login wall — saved storage as-is');
    return;
  }

  await page.locator('#signin-email').fill(email);
  await page.locator('#signin-password').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();

  const err = page.locator('p.text-red-600');
  const dashLink = page.getByRole('link', { name: /^Dashboard$/ }).first();

  const deadline = Date.now() + 90_000;
  let lastError = '';
  while (Date.now() < deadline) {
    if (await err.isVisible().catch(() => false)) {
      lastError = (await err.innerText().catch(() => '')) || 'Unknown error';
      break;
    }
    if (await dashLink.isVisible().catch(() => false)) {
      lastError = '';
      break;
    }
    await page.waitForTimeout(400);
  }

  if (lastError) {
    const shot = path.join(authDir, 'login-failure.png');
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    await browser.close();
    throw new Error(
      `[e2e global-setup] Login failed for ${email}: ${lastError}\n` +
        `Check Supabase: user exists, Email auth enabled, email confirmed, password correct.\n` +
        `Screenshot: ${shot}`,
    );
  }

  if (!(await dashLink.isVisible().catch(() => false))) {
    const shot = path.join(authDir, 'login-timeout.png');
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    await browser.close();
    throw new Error(`[e2e global-setup] Login timed out (no Dashboard link). Screenshot: ${shot}`);
  }

  await context.storageState({ path: authFile });
  await browser.close();
  // eslint-disable-next-line no-console
  console.log('[e2e global-setup] Saved authenticated storage to', authFile);
}
