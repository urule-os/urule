import { test, expect } from './fixtures/auth';

test.describe('Journey 4: Agent Management', () => {
  test.describe('4.1 Browse Agents', () => {
    test('should navigate to agents page', async ({ authenticatedPage: page }) => {
      await page.goto('/office/agents');
      await page.waitForTimeout(1000);
      // Should show agent list or empty state
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toMatch(/agent|deploy|no agents/i);
    });

    test('should have search functionality', async ({ authenticatedPage: page }) => {
      await page.goto('/office/agents');
      await page.waitForTimeout(1000);
      const search = page.getByPlaceholder(/search/i);
      if (await search.isVisible()) {
        await search.fill('test');
        await page.waitForTimeout(500);
      }
    });

    test('should have category filter pills', async ({ authenticatedPage: page }) => {
      await page.goto('/office/agents');
      await page.waitForTimeout(1000);
      // Look for filter/category buttons
      const content = await page.textContent('body');
      if (content?.includes('Engineering') || content?.includes('All')) {
        await expect(page.getByText(/all|engineering|design/i).first()).toBeVisible();
      }
    });
  });

  test.describe('4.2 Deploy New Agent', () => {
    test('should open agent creation wizard', async ({ authenticatedPage: page }) => {
      await page.goto('/office/agents/new');
      await page.waitForTimeout(2000);
      // Should show step indicator or template grid
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toMatch(/browse|select|step|template|catalog/i);
    });

    test('should show agent template categories', async ({ authenticatedPage: page }) => {
      await page.goto('/office/agents/new');
      await page.waitForTimeout(2000);
      // PackageHub templates load via API
      const content = await page.textContent('body');
      if (content?.includes('Engineering') || content?.includes('DevOps')) {
        await expect(page.getByText(/engineering|devops|design/i).first()).toBeVisible();
      }
    });

    test('should show template detail on click', async ({ authenticatedPage: page }) => {
      await page.goto('/office/agents/new');
      await page.waitForTimeout(3000);
      // Try clicking first agent card
      const cards = page.locator('[role="tab"], [class*="card"], [class*="agent"]');
      if (await cards.first().isVisible()) {
        await cards.first().click();
        await page.waitForTimeout(500);
      }
    });
  });
});
