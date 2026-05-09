# VitaPlate E2E Tests

Playwright test suite covering all critical user flows.

## Setup

```bash
cd e2e
npm install
npx playwright install chromium
```

## Running Tests

```bash
# Run all tests (headless, against production)
npm test

# Run with browser visible
npm run test:headed

# Run with Playwright UI (recommended for debugging)
npm run test:ui

# Run against local dev server
BASE_URL=http://localhost:5173 API_URL=http://localhost:3001 npm test

# Run single test file
npx playwright test tests/01-landing.spec.js

# Run specific test
npx playwright test --grep "generates recipe"
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `https://www.vitaplate.ai` | Frontend URL |
| `API_URL` | `https://vitaplate-core-production.up.railway.app` | Backend URL |
| `TEST_EMAIL` | `test@vitaplate.ai` | Test user email |
| `TEST_PASSWORD` | `TestPassword123!` | Test user password |

## Test Files

| File | What it tests |
|---|---|
| `01-landing.spec.js` | Landing page, public routes, SEO, mobile |
| `02-navigation.spec.js` | Sidebar, all 23 pages load, nav items |
| `03-onboarding.spec.js` | All 5 onboarding steps, step progression |
| `04-lab-recipe.spec.js` | Lab upload, recipe generator end-to-end |
| `05-api-health.spec.js` | Backend health, auth checks, CORS, performance |

## Test Strategy

- **No auth mocking** — tests run against real production with auth bypass
- **Sequential execution** — prevents DB conflicts between tests
- **Retry once** — flaky network tests get one automatic retry
- **Screenshots + video** on failure — saved to `playwright-report/`

## Viewing Reports

After a run:
```bash
npm run report
```

## Notes on Auth Tests

Pages that require auth will skip gracefully if not logged in.
To run the full suite including auth flows, set `TEST_EMAIL` and `TEST_PASSWORD`
to a real VitaPlate account and add Google OAuth session storage.
