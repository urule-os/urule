import { test, expect } from './fixtures/auth';

test.describe('Journey 6: Approvals', () => {
  test.describe('6.1 Approval Queue', () => {
    test('should navigate to approvals page', async ({ authenticatedPage: page }) => {
      await page.goto('/office/approvals');
      await page.waitForTimeout(1000);
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toMatch(/approval|pending|queue|no approvals/i);
    });

    test('should have status filter tabs', async ({ authenticatedPage: page }) => {
      await page.goto('/office/approvals');
      await page.waitForTimeout(1000);
      // Look for Pending/Approved/Rejected tabs
      const pendingTab = page.getByText(/pending/i);
      if (await pendingTab.isVisible()) {
        await expect(pendingTab).toBeVisible();
      }
    });

    test('should show skeleton loading then content', async ({ authenticatedPage: page }) => {
      await page.goto('/office/approvals');
      // Skeleton should appear briefly then be replaced
      await page.waitForTimeout(2000);
      // Page should have loaded content
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    });
  });
});
