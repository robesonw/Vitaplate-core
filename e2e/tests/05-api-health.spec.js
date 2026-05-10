import { test, expect, API_URL } from '../fixtures/helpers.js';

// These tests hit the backend API directly — no auth needed for health checks
test.describe('API health checks', () => {

  test('backend health endpoint returns ok', async ({ request }) => {
    const res = await request.get(`${API_URL}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.time).toBeTruthy();
  });

  test('auth required endpoints return 401 without token', async ({ request }) => {
    const endpoints = [
      '/api/user/me',
      '/api/labs',
      '/api/meal-plans',
      '/api/gamification/profile',
    ];

    for (const endpoint of endpoints) {
      const res = await request.get(`${API_URL}${endpoint}`);
      expect([401, 403]).toContain(res.status(),
        `${endpoint} should require auth but returned ${res.status()}`);
    }
  });

  test('POST /api/ai/invoke requires prompt', async ({ request }) => {
    // Without auth
    const res = await request.post(`${API_URL}/api/ai/invoke`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect([400, 401, 403]).toContain(res.status());
  });

  test('CORS headers present on API responses', async ({ request }) => {
    const res = await request.fetch(`${API_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://www.vitaplate.ai',
        'Access-Control-Request-Method': 'GET',
      },
    });
    const corsHeader = res.headers()['access-control-allow-origin'];
    expect(corsHeader).toBeTruthy();
  });

  test('wearables status endpoint structure', async ({ request }) => {
    // Without auth — should return 401 not 500
    const res = await request.get(`${API_URL}/api/wearables/status`);
    expect(res.status()).not.toBe(500);
  });

  test('calendar status endpoint not 500', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/calendar/status`);
    expect(res.status()).not.toBe(500);
  });
});

test.describe('Performance checks', () => {

  test('landing page loads in under 4 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.locator('h1').waitFor();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(4000);
  });

  test('dashboard loads in under 5 seconds when authed', async ({ page }) => {
    const start = Date.now();
    await page.goto('/Dashboard');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
