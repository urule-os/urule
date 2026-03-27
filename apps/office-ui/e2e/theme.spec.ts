import { test, expect } from './fixtures/auth';

test.describe('Cross-cutting: Theme', () => {
  test('should default to dark theme', async ({ authenticatedPage: page }) => {
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('should switch to light theme via settings', async ({ authenticatedPage: page }) => {
    await page.goto('/office/settings');
    await page.waitForTimeout(1000);
    const lightBtn = page.getByText(/^light$/i);
    if (await lightBtn.isVisible()) {
      await lightBtn.click();
      await page.waitForTimeout(500);
      const html = page.locator('html');
      await expect(html).toHaveClass(/light/);
    }
  });

  test('should persist theme after navigation', async ({ authenticatedPage: page }) => {
    await page.goto('/office/settings');
    await page.waitForTimeout(1000);
    const lightBtn = page.getByText(/^light$/i);
    if (await lightBtn.isVisible()) {
      await lightBtn.click();
      await page.waitForTimeout(300);
      await page.goto('/office');
      await page.waitForTimeout(500);
      const html = page.locator('html');
      await expect(html).toHaveClass(/light/);
    }
  });

  test('should persist theme after page reload', async ({ authenticatedPage: page }) => {
    await page.goto('/office/settings');
    await page.waitForTimeout(1000);
    const lightBtn = page.getByText(/^light$/i);
    if (await lightBtn.isVisible()) {
      await lightBtn.click();
      await page.waitForTimeout(300);
      await page.reload();
      await page.waitForTimeout(1000);
      const html = page.locator('html');
      await expect(html).toHaveClass(/light/);
    }
  });
});
