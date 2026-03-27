import { test, expect } from './fixtures/auth';

test.describe('Journey 9: Integrations', () => {
  test('should navigate to integrations page', async ({ authenticatedPage: page }) => {
    await page.goto('/office/integrations');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/integration|tool|connect|mcp/i);
  });

  test('should have category filter tabs', async ({ authenticatedPage: page }) => {
    await page.goto('/office/integrations');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/all|communication|productivity|development/i);
  });

  test('should show available tools', async ({ authenticatedPage: page }) => {
    await page.goto('/office/integrations');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/slack|github|jira|connect/i);
  });
});
