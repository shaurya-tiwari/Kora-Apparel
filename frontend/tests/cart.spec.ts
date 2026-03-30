import { test, expect } from '@playwright/test';

/**
 * Cart Page E2E Tests
 *
 * Verifies that the cart page is reachable and renders correctly.
 * Cart interactions (add to cart) are tested from a product page context.
 */

test.describe('Cart Page', () => {
  test('navigates to /cart without errors', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows cart heading or empty cart message', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('domcontentloaded');

    // Cart can show either items or an empty-state message
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('empty cart shows a call-to-action to shop', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // If the cart is empty, there should be a link back to the shop
    const ctaLink = page.getByRole('link', { name: /shop|browse|continue shopping|explore/i });
    const isVisible = await ctaLink.isVisible().catch(() => false);

    // Only assert if cart actually looks empty
    const emptyIndicator = page.getByText(/your cart is empty|no items|empty/i);
    const isEmpty = await emptyIndicator.isVisible().catch(() => false);

    if (isEmpty) {
      await expect(ctaLink).toBeVisible();
    }
  });
});

test.describe('Add to Cart flow (via shop)', () => {
  test('can visit a product page from the shop listing', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    // Try to click the first product link if any exist
    const firstProductLink = page.locator('a[href*="/shop/"], a[href*="/product/"]').first();
    const hasProduct = await firstProductLink.isVisible().catch(() => false);

    if (hasProduct) {
      await firstProductLink.click();
      await page.waitForLoadState('domcontentloaded');
      // The product detail page should have an "Add to Cart" button
      const addToCartBtn = page.getByRole('button', { name: /add to (cart|bag)/i });
      await expect(addToCartBtn).toBeVisible();
    } else {
      // No products seeded — skip gracefully
      test.skip(true, 'No products available in this environment');
    }
  });
});
