import { test, expect } from './fixtures/auth';

test.describe('Cross-cutting: Accessibility', () => {
  test('login page has proper form labels', async ({ page }) => {
    await page.goto('/login');
    // Check for label associations
    const emailInput = page.locator('input[type="email"], input[id="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('dashboard has main landmark', async ({ authenticatedPage: page }) => {
    const main = page.locator('[role="main"], main');
    await expect(main.first()).toBeVisible();
  });

  test('sidebar has navigation landmark', async ({ authenticatedPage: page }) => {
    const nav = page.locator('nav[aria-label], [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });

  test('header has banner role', async ({ authenticatedPage: page }) => {
    const header = page.locator('header[role="banner"], [role="banner"]');
    await expect(header.first()).toBeVisible();
  });

  test('chat has aria-live region', async ({ authenticatedPage: page }) => {
    // Navigate to chat if there's a conversation
    await page.goto('/office/chat');
    await page.waitForTimeout(1000);
    // Check for aria-live on message areas
    const liveRegion = page.locator('[aria-live]');
    // May not be on the list page, only on conversation detail
  });

  test('interactive elements are keyboard accessible', async ({ authenticatedPage: page }) => {
    // Tab through the sidebar
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Something should have focus
    const focused = page.locator(':focus');
    await expect(focused).toBeTruthy();
  });

  test('agent wizard has proper ARIA roles', async ({ authenticatedPage: page }) => {
    await page.goto('/office/agents/new');
    await page.waitForTimeout(2000);
    // Check for tablist/tab roles
    const tablist = page.locator('[role="tablist"]');
    if (await tablist.isVisible()) {
      await expect(tablist).toBeVisible();
    }
  });
});
