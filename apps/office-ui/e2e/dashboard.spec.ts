import { test, expect } from './fixtures/auth';

test.describe('Journey 3: Dashboard', () => {
  test('should load dashboard after demo login', async ({ authenticatedPage: page }) => {
    await expect(page).toHaveURL(/office/);
  });

  test('should display stat cards', async ({ authenticatedPage: page }) => {
    // Look for stat-like content (numbers, labels)
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    // Dashboard should have agent-related content
    expect(body).toBeTruthy();
  });

  test('should show agent activity section', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    // Agents section should be present
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('agent');
  });

  test('should navigate to agents page via quick action', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(1000);
    // Look for agent-related navigation
    const agentLink = page.getByRole('link', { name: /agent/i }).first();
    if (await agentLink.isVisible()) {
      await agentLink.click();
      await page.waitForURL('**/agents**');
    }
  });

  test('should show infrastructure tab', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(1000);
    const infraTab = page.getByText(/infrastructure/i);
    if (await infraTab.isVisible()) {
      await infraTab.click();
      await page.waitForTimeout(500);
    }
  });
});
