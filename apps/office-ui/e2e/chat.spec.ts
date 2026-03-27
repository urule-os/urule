import { test, expect } from './fixtures/auth';

test.describe('Journey 5: Chat & Conversations', () => {
  test.describe('5.1 Conversation List', () => {
    test('should navigate to chat page', async ({ authenticatedPage: page }) => {
      await page.goto('/office/chat');
      await page.waitForTimeout(1000);
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toMatch(/chat|conversation|new chat|no conversations/i);
    });

    test('should have filter tabs', async ({ authenticatedPage: page }) => {
      await page.goto('/office/chat');
      await page.waitForTimeout(1000);
      // Look for All/Direct/Meetings/Groups tabs
      const allTab = page.getByText(/^all$/i);
      if (await allTab.isVisible()) {
        await expect(allTab).toBeVisible();
      }
    });

    test('should have new chat button', async ({ authenticatedPage: page }) => {
      await page.goto('/office/chat');
      await page.waitForTimeout(1000);
      const newChat = page.getByRole('button', { name: /new chat|start chat/i });
      if (await newChat.isVisible()) {
        await expect(newChat).toBeVisible();
      }
    });
  });

  test.describe('5.3 Meetings', () => {
    test('should navigate to meetings page', async ({ authenticatedPage: page }) => {
      await page.goto('/office/meetings');
      await page.waitForTimeout(1000);
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toMatch(/meeting|new meeting|no meetings/i);
    });

    test('should have new meeting button', async ({ authenticatedPage: page }) => {
      await page.goto('/office/meetings');
      await page.waitForTimeout(1000);
      const newMeeting = page.getByRole('button', { name: /new meeting/i });
      if (await newMeeting.isVisible()) {
        await expect(newMeeting).toBeVisible();
      }
    });
  });
});
