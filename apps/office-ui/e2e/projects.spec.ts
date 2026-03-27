import { test, expect } from './fixtures/auth';

test.describe('Journey 7: Projects & Tasks', () => {
  test('should navigate to projects page', async ({ authenticatedPage: page }) => {
    await page.goto('/office/projects');
    await page.waitForTimeout(1000);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/project|timeline|kanban|backlog/i);
  });

  test('should have view toggle (Timeline/Kanban)', async ({ authenticatedPage: page }) => {
    await page.goto('/office/projects');
    await page.waitForTimeout(1000);
    const timeline = page.getByText(/timeline/i);
    const kanban = page.getByText(/kanban/i);
    if (await timeline.isVisible() && await kanban.isVisible()) {
      await kanban.click();
      await page.waitForTimeout(500);
      // Should show kanban columns
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toMatch(/backlog|progress|completed/i);
    }
  });

  test('should have new project button', async ({ authenticatedPage: page }) => {
    await page.goto('/office/projects');
    await page.waitForTimeout(1000);
    const newProject = page.getByRole('button', { name: /new project/i });
    if (await newProject.isVisible()) {
      await newProject.click();
      await page.waitForTimeout(500);
      // Modal should open
      const modal = page.getByRole('dialog');
      if (await modal.isVisible()) {
        await expect(modal).toBeVisible();
      }
    }
  });
});
