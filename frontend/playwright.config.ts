import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Kora Apparel frontend E2E tests.
 * 
 * In CI, the frontend dev server is started automatically before tests run.
 * Locally, you can run `npm run dev` in the frontend folder first, or let
 * Playwright start it for you via `webServer`.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Auto-start the Next.js dev server when running tests locally
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // In CI the server is started separately, so we just wait for it
    ...(process.env.CI ? { command: 'echo "CI: server started externally"' } : {}),
  },
});
