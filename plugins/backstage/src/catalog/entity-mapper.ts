/**
 * Maps Urule entities to Backstage catalog entity format.
 *
 * Backstage entities follow the format:
 * {
 *   apiVersion: 'backstage.io/v1alpha1',
 *   kind: 'Component' | 'Resource' | 'System' | 'Group',
 *   metadata: { name, description, annotations, labels },
 *   spec: { type, owner, lifecycle, ... }
 * }
 */

export interface BackstageCatalogEntity {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    description?: string;
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
  };
  spec: Record<string, unknown>;
}

export interface UruleOrg {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface UruleWorkspace {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  description: string;
  status: string;
}

export interface UruleAgent {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: string;
}

export function mapOrgToGroup(org: UruleOrg): BackstageCatalogEntity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Group',
    metadata: {
      name: org.slug,
      description: `Urule Organization: ${org.name}`,
      annotations: {
        'urule.dev/org-id': org.id,
        'urule.dev/entity-type': 'org',
      },
      labels: {
        'urule.dev/status': org.status,
      },
    },
    spec: {
      type: 'organization',
      children: [],
    },
  };
}

export function mapWorkspaceToSystem(workspace: UruleWorkspace, orgSlug: string): BackstageCatalogEntity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'System',
    metadata: {
      name: `${orgSlug}-${workspace.slug}`,
      description: workspace.description || `Urule Workspace: ${workspace.name}`,
      annotations: {
        'urule.dev/workspace-id': workspace.id,
        'urule.dev/org-id': workspace.orgId,
        'urule.dev/entity-type': 'workspace',
      },
      labels: {
        'urule.dev/status': workspace.status,
      },
    },
    spec: {
      owner: orgSlug,
    },
  };
}

export function mapAgentToComponent(agent: UruleAgent, workspaceName: string): BackstageCatalogEntity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: `${workspaceName}-${agent.name.toLowerCase().replace(/\s+/g, '-')}`,
      description: agent.description || `Urule Agent: ${agent.name}`,
      annotations: {
        'urule.dev/agent-id': agent.id,
        'urule.dev/workspace-id': agent.workspaceId,
        'urule.dev/entity-type': 'agent',
      },
      labels: {
        'urule.dev/status': agent.status,
      },
    },
    spec: {
      type: 'ai-agent',
      lifecycle: agent.status === 'active' ? 'production' : 'experimental',
      owner: workspaceName,
      system: workspaceName,
    },
  };
}
