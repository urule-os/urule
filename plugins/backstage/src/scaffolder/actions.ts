/**
 * Scaffolder actions for Backstage templates.
 * These would be registered with Backstage's scaffolder backend
 * to provide Urule-specific template actions.
 */

export interface ScaffolderAction {
  id: string;
  description: string;
  schema: {
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  };
}

export function getUruleScaffolderActions(): ScaffolderAction[] {
  return [
    {
      id: 'urule:workspace:create',
      description: 'Create a new Urule workspace',
      schema: {
        input: {
          type: 'object',
          required: ['orgId', 'name', 'slug'],
          properties: {
            orgId: { type: 'string', description: 'Organization ID' },
            name: { type: 'string', description: 'Workspace name' },
            slug: { type: 'string', description: 'Workspace slug' },
            description: { type: 'string', description: 'Workspace description' },
          },
        },
        output: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string' },
          },
        },
      },
    },
    {
      id: 'urule:agent:register',
      description: 'Register a new AI agent in a workspace',
      schema: {
        input: {
          type: 'object',
          required: ['workspaceId', 'name'],
          properties: {
            workspaceId: { type: 'string', description: 'Workspace ID' },
            name: { type: 'string', description: 'Agent name' },
            description: { type: 'string', description: 'Agent description' },
            personalityPackId: { type: 'string', description: 'Personality pack to install' },
          },
        },
        output: {
          type: 'object',
          properties: {
            agentId: { type: 'string' },
          },
        },
      },
    },
    {
      id: 'urule:package:install',
      description: 'Install a package in a workspace',
      schema: {
        input: {
          type: 'object',
          required: ['workspaceId', 'packageName'],
          properties: {
            workspaceId: { type: 'string', description: 'Workspace ID' },
            packageName: { type: 'string', description: 'Package name to install' },
            version: { type: 'string', description: 'Package version (default: latest)' },
          },
        },
        output: {
          type: 'object',
          properties: {
            installationId: { type: 'string' },
          },
        },
      },
    },
    {
      id: 'urule:mcp:bind',
      description: 'Bind an MCP server to a workspace',
      schema: {
        input: {
          type: 'object',
          required: ['workspaceId', 'serverId'],
          properties: {
            workspaceId: { type: 'string', description: 'Workspace ID' },
            serverId: { type: 'string', description: 'MCP server ID to bind' },
            config: { type: 'object', description: 'Binding configuration' },
          },
        },
        output: {
          type: 'object',
          properties: {
            bindingId: { type: 'string' },
          },
        },
      },
    },
  ];
}
