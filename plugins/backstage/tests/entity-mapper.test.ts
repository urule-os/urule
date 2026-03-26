import { describe, it, expect } from 'vitest';
import { mapOrgToGroup, mapWorkspaceToSystem, mapAgentToComponent } from '../src/catalog/entity-mapper.js';

describe('EntityMapper', () => {
  describe('mapOrgToGroup', () => {
    it('maps org to Backstage Group entity', () => {
      const entity = mapOrgToGroup({
        id: 'org-123',
        name: 'Acme Corp',
        slug: 'acme-corp',
        status: 'active',
      });

      expect(entity.apiVersion).toBe('backstage.io/v1alpha1');
      expect(entity.kind).toBe('Group');
      expect(entity.metadata.name).toBe('acme-corp');
      expect(entity.metadata.annotations?.['urule.dev/org-id']).toBe('org-123');
      expect(entity.metadata.labels?.['urule.dev/status']).toBe('active');
      expect(entity.spec.type).toBe('organization');
    });
  });

  describe('mapWorkspaceToSystem', () => {
    it('maps workspace to Backstage System entity', () => {
      const entity = mapWorkspaceToSystem(
        {
          id: 'ws-456',
          orgId: 'org-123',
          name: 'Dev Team',
          slug: 'dev-team',
          description: 'Development workspace',
          status: 'active',
        },
        'acme-corp',
      );

      expect(entity.kind).toBe('System');
      expect(entity.metadata.name).toBe('acme-corp-dev-team');
      expect(entity.metadata.description).toBe('Development workspace');
      expect(entity.metadata.annotations?.['urule.dev/workspace-id']).toBe('ws-456');
      expect(entity.spec.owner).toBe('acme-corp');
    });
  });

  describe('mapAgentToComponent', () => {
    it('maps agent to Backstage Component entity', () => {
      const entity = mapAgentToComponent(
        {
          id: 'agent-789',
          workspaceId: 'ws-456',
          name: 'Code Reviewer',
          description: 'AI code review agent',
          status: 'idle',
        },
        'acme-dev-team',
      );

      expect(entity.kind).toBe('Component');
      expect(entity.metadata.name).toBe('acme-dev-team-code-reviewer');
      expect(entity.metadata.annotations?.['urule.dev/agent-id']).toBe('agent-789');
      expect(entity.spec.type).toBe('ai-agent');
      expect(entity.spec.lifecycle).toBe('experimental');
    });

    it('sets lifecycle to production for active agents', () => {
      const entity = mapAgentToComponent(
        {
          id: 'agent-789',
          workspaceId: 'ws-456',
          name: 'Active Agent',
          description: '',
          status: 'active',
        },
        'workspace',
      );

      expect(entity.spec.lifecycle).toBe('production');
    });
  });
});
