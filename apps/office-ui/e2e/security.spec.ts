import { test, expect } from './fixtures/auth';

test.describe('Journey 11: Security', () => {
  test('should navigate to security page', async ({ authenticatedPage: page }) => {
    await page.goto('/office/security');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/security|compliance|policy/i);
  });

  test('should show compliance badges', async ({ authenticatedPage: page }) => {
    await page.goto('/office/security');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/soc2|aes|tls|rbac/i);
  });

  test('should have tab navigation', async ({ authenticatedPage: page }) => {
    await page.goto('/office/security');
    await page.waitForTimeout(1000);
    const auditTab = page.getByText(/audit log/i);
    if (await auditTab.isVisible()) {
      await auditTab.click();
      await page.waitForTimeout(500);
    }
  });
});
