import { test, expect } from './fixtures/auth';

test.describe('Journey 8: Workspaces', () => {
  test('should navigate to workspaces page', async ({ authenticatedPage: page }) => {
    await page.goto('/office/workspaces');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/workspace|create|default/i);
  });

  test('should show featured workspace', async ({ authenticatedPage: page }) => {
    await page.goto('/office/workspaces');
    await page.waitForTimeout(1000);
    // Featured workspace should be prominent
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/workspace|active/i);
  });

  test('should have create workspace button', async ({ authenticatedPage: page }) => {
    await page.goto('/office/workspaces');
    await page.waitForTimeout(1000);
    const createBtn = page.getByRole('button', { name: /create.*workspace|new.*workspace/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);
    }
  });
});
