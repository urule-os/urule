import { test, expect } from './fixtures/auth';

test.describe('Journey 10: Settings', () => {
  test('should navigate to settings page', async ({ authenticatedPage: page }) => {
    await page.goto('/office/settings');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/settings|provider|workspace|theme/i);
  });

  test('should show model provider section', async ({ authenticatedPage: page }) => {
    await page.goto('/office/settings');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/provider|claude|openai|api key/i);
  });

  test('should show theme toggle', async ({ authenticatedPage: page }) => {
    await page.goto('/office/settings');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/dark|light|system|theme/i);
  });

  test('should switch theme', async ({ authenticatedPage: page }) => {
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
});
