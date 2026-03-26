import { describe, it, expect } from 'vitest';
import { CatalogSyncService, type RegistryClient } from '../src/catalog/sync-service.js';

function createMockClient(data?: {
  orgs?: Array<{ id: string; name: string; slug: string; status: string }>;
  workspaces?: Record<string, Array<{ id: string; orgId: string; name: string; slug: string; description: string; status: string }>>;
  agents?: Record<string, Array<{ id: string; workspaceId: string; name: string; description: string; status: string }>>;
}): RegistryClient {
  return {
    async fetchOrgs() {
      return data?.orgs ?? [];
    },
    async fetchWorkspaces(orgId: string) {
      return data?.workspaces?.[orgId] ?? [];
    },
    async fetchAgents(workspaceId: string) {
      return data?.agents?.[workspaceId] ?? [];
    },
  };
}

describe('CatalogSyncService', () => {
  it('returns empty result when no orgs exist', async () => {
    const client = createMockClient();
    const service = new CatalogSyncService(client);
    const result = await service.sync();

    expect(result.synced).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.entities).toHaveLength(0);
  });

  it('syncs orgs as Group entities', async () => {
    const client = createMockClient({
      orgs: [{ id: 'org-1', name: 'Test Org', slug: 'test-org', status: 'active' }],
    });
    const service = new CatalogSyncService(client);
    const result = await service.sync();

    expect(result.synced).toBe(1);
    expect(result.entities[0].kind).toBe('Group');
    expect(result.entities[0].metadata.name).toBe('test-org');
  });

  it('syncs full hierarchy (org + workspace + agents)', async () => {
    const client = createMockClient({
      orgs: [{ id: 'org-1', name: 'Org', slug: 'org', status: 'active' }],
      workspaces: {
        'org-1': [{ id: 'ws-1', orgId: 'org-1', name: 'WS', slug: 'ws', description: '', status: 'active' }],
      },
      agents: {
        'ws-1': [{ id: 'a-1', workspaceId: 'ws-1', name: 'Agent', description: '', status: 'idle' }],
      },
    });
    const service = new CatalogSyncService(client);
    const result = await service.sync();

    expect(result.synced).toBe(3);
    expect(result.entities.map((e) => e.kind)).toEqual(['Group', 'System', 'Component']);
  });

  it('records errors without failing entire sync', async () => {
    const client: RegistryClient = {
      async fetchOrgs() {
        return [{ id: 'org-1', name: 'Org', slug: 'org', status: 'active' }];
      },
      async fetchWorkspaces() {
        throw new Error('connection refused');
      },
      async fetchAgents() {
        return [];
      },
    };

    const service = new CatalogSyncService(client);
    const result = await service.sync();

    expect(result.synced).toBe(1); // org was synced
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('connection refused');
  });

  it('tracks lastSyncAt', async () => {
    const client = createMockClient();
    const service = new CatalogSyncService(client);

    expect(service.getLastSyncAt()).toBeNull();
    await service.sync();
    expect(service.getLastSyncAt()).toBeTruthy();
  });
});
