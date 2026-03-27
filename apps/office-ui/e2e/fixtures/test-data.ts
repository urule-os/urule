import type { Page } from '@playwright/test';

const API_BASE = process.env.REGISTRY_URL ?? 'http://localhost:3001';

/**
 * Helper to create test data via API calls.
 * Use these to set up fixtures before UI tests.
 */
export const testData = {
  /**
   * Create a test agent via the registry API.
   */
  async createAgent(options: {
    name: string;
    description?: string;
    workspaceId?: string;
  }) {
    const res = await fetch(`${API_BASE}/api/v1/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: options.name,
        description: options.description ?? 'Test agent',
        workspaceId: options.workspaceId ?? 'test-workspace',
        config: {},
      }),
    });
    return res.json();
  },

  /**
   * Create a test conversation via the registry API.
   */
  async createConversation(options: {
    title: string;
    workspaceId?: string;
    agentIds?: string[];
  }) {
    const res = await fetch(`${API_BASE}/api/v1/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: options.title,
        workspaceId: options.workspaceId ?? 'test-workspace',
        agentIds: options.agentIds ?? [],
      }),
    });
    return res.json();
  },

  /**
   * Create a test approval via the approvals API.
   */
  async createApproval(options: {
    title: string;
    agentId?: string;
    workspaceId?: string;
  }) {
    const approvalsUrl = process.env.APPROVALS_URL ?? 'http://localhost:3003';
    const res = await fetch(`${approvalsUrl}/api/v1/approvals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: `test-run-${Date.now()}`,
        workspaceId: options.workspaceId ?? 'test-workspace',
        agentId: options.agentId ?? 'test-agent',
        action: 'test-action',
        reason: 'Test approval for E2E',
        title: options.title,
        priority: 'medium',
      }),
    });
    return res.json();
  },

  /**
   * Navigate to a page and wait for it to load.
   * Handles any loading states.
   */
  async navigateAndWait(page: Page, path: string) {
    await page.goto(path);
    // Wait for skeletons to disappear (loading complete)
    await page.waitForTimeout(1000);
  },
};
