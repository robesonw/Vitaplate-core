import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth', 'user.json');
const storageState = fs.existsSync(authFile) ? authFile : undefined;

export default defineConfig({
  globalSetup: path.join(__dirname, 'global-setup.js'),
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false, // Run sequentially — tests share state (DB)
  retries: 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL:           process.env.BASE_URL || 'https://www.vitaplate.ai',
    ...(storageState ? { storageState } : {}),
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'retain-on-failure',
    actionTimeout:     15_000,
    navigationTimeout: 30_000,
  },

  projects: process.env.PLAYWRIGHT_MOBILE === '1'
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['iPhone 14'] } },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      ],
});
