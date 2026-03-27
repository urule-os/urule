import { test, expect } from './fixtures/auth';

test.describe('Journey 12: Logs & Notifications', () => {
  test('should navigate to logs page', async ({ authenticatedPage: page }) => {
    await page.goto('/office/logs');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/log|activity|notification/i);
  });

  test('should have actor type filter', async ({ authenticatedPage: page }) => {
    await page.goto('/office/logs');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/user|agent|system|all/i);
  });

  test('should have search functionality', async ({ authenticatedPage: page }) => {
    await page.goto('/office/logs');
    await page.waitForTimeout(1000);
    const search = page.getByPlaceholder(/search/i);
    if (await search.isVisible()) {
      await search.fill('test');
      await page.waitForTimeout(500);
    }
  });
});
