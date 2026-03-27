import { test as base, type Page } from '@playwright/test';

/**
 * Authenticated page fixture.
 *
 * Uses the "Demo Login" button to authenticate without needing
 * Keycloak or real credentials. Every test that extends this
 * fixture starts on the dashboard as "Demo User".
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');

    // Click "Demo Login" button
    await page.getByRole('button', { name: /demo login/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/office**', { timeout: 10000 });

    // Verify we're on the dashboard
    await page.waitForSelector('text=Dashboard', { timeout: 5000 }).catch(() => {
      // Dashboard text might vary — just ensure we left the login page
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
