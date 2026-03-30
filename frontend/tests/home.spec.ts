import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests
 * 
 * These tests verify the core layout and navigation are rendered correctly.
 * They run against the live Next.js dev or standalone server — no mocks.
 */

test.describe('Homepage', () => {
  test('loads without errors and has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/kora/i);
  });

  test('displays the KORA brand name in the navbar', async ({ page }) => {
    await page.goto('/');
    // The brand logo/wordmark should be visible
    const brand = page.getByText(/kora/i).first();
    await expect(brand).toBeVisible();
  });

  test('has a working navigation link to the shop', async ({ page }) => {
    await page.goto('/');
    // Look for a Shop/Collection link in the nav
    const shopLink = page.getByRole('link', { name: /shop|collection|store/i }).first();
    await expect(shopLink).toBeVisible();
  });

  test('page has no broken layout (main content is visible)', async ({ page }) => {
    await page.goto('/');
    // Ensure the page body renders actual content (not a blank white page)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();

    // Check that at least one semantic section or main element exists
    const main = page.locator('main, [role="main"], section').first();
    await expect(main).toBeVisible();
  });

  test('renders a hero or featured section', async ({ page }) => {
    await page.goto('/');
    // The homepage should have some prominent heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading.first()).toBeVisible();
  });
});
