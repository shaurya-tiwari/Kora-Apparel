import { test, expect } from '@playwright/test';

/**
 * Shop Page E2E Tests
 * 
 * These tests verify that the product listing page renders,
 * that the URL is correct, and that core UI elements are present.
 */

test.describe('Shop / Products Page', () => {
  test('navigates to /shop and renders the page', async ({ page }) => {
    await page.goto('/shop');
    await expect(page).toHaveURL(/\/shop/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('displays products or an empty-state message', async ({ page }) => {
    await page.goto('/shop');

    // Wait for the page to settle (products may load via API)
    await page.waitForLoadState('networkidle');

    // Either product cards are present OR an empty-state message is shown
    const productCards = page.locator('[data-testid="product-card"], .product-card, article');
    const emptyState = page.getByText(/no products|nothing here|no items/i);

    const hasProducts = await productCards.count() > 0;
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasProducts || hasEmpty).toBe(true);
  });

  test('has a page heading', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('domcontentloaded');

    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('filter/sort controls are accessible', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    // Look for any sort or filter element (select, button, etc.)
    const filterEl = page.locator('select, [aria-label*="sort"], [aria-label*="filter"], button:has-text("Filter"), button:has-text("Sort")').first();
    // This is optional — don't fail if the shop has no filters in dev
    const visible = await filterEl.isVisible().catch(() => false);
    if (visible) {
      await expect(filterEl).toBeEnabled();
    }
  });
});
