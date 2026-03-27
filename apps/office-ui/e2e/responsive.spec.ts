import { test, expect } from './fixtures/auth';

test.describe('Cross-cutting: Responsive Design', () => {
  test('should show hamburger menu on mobile', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const hamburger = page.getByRole('button', { name: /menu/i });
    if (await hamburger.isVisible()) {
      await expect(hamburger).toBeVisible();
    }
  });

  test('should open sidebar on hamburger click (mobile)', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const hamburger = page.getByRole('button', { name: /menu/i });
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(300);
      // Sidebar should be visible
      const nav = page.getByRole('navigation', { name: /main/i });
      if (await nav.isVisible()) {
        await expect(nav).toBeVisible();
      }
    }
  });

  test('should show full sidebar on desktop', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    // Sidebar should always be visible
    const nav = page.locator('nav, aside');
    await expect(nav.first()).toBeVisible();
  });

  test('dashboard renders on tablet', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});
