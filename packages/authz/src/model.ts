/**
 * OpenFGA authorization model definition for Urule entities.
 *
 * Defines the types, relations, and inheritance rules for:
 * - org: organizations with owner, admin, member
 * - workspace: workspaces scoped to orgs, inheriting membership
 * - room: rooms within workspaces
 * - agent: AI agents with invocation permissions
 * - package: installable packages
 * - mcp_server: MCP servers with invocation permissions
 */
export const URULE_AUTH_MODEL = {
  schema_version: '1.1',
  type_definitions: [
    {
      type: 'user',
      relations: {},
      metadata: null,
    },
    {
      type: 'org',
      relations: {
        owner: {
          this: {},
        },
        admin: {
          union: {
            child: [
              { this: {} },
              { computedUserset: { relation: 'owner' } },
            ],
          },
        },
        member: {
          union: {
            child: [
              { this: {} },
              { computedUserset: { relation: 'admin' } },
            ],
          },
        },
      },
      metadata: {
        relations: {
          owner: { directly_related_user_types: [{ type: 'user' }] },
          admin: { directly_related_user_types: [{ type: 'user' }] },
          member: { directly_related_user_types: [{ type: 'user' }] },
        },
      },
    },
    {
      type: 'workspace',
      relations: {
        owner: {
          this: {},
        },
        admin: {
          union: {
            child: [
              { this: {} },
              { computedUserset: { relation: 'owner' } },
            ],
          },
        },
        member: {
          union: {
            child: [
              { this: {} },
              { computedUserset: { relation: 'admin' } },
              { tupleToUserset: { tupleset: { relation: 'parent' }, computedUserset: { relation: 'member' } } },
            ],
          },
        },
        viewer: {
          union: {
            child: [
              { this: {} },
              { computedUserset: { relation: 'member' } },
            ],
          },
        },
        parent: {
          this: {},
        },
      },
      metadata: {
        relations: {
          owner: { directly_related_user_types: [{ type: 'user' }] },
          admin: { directly_related_user_types: [{ type: 'user' }] },
          member: { directly_related_user_types: [{ type: 'user' }] },
          viewer: { directly_related_user_types: [{ type: 'user' }] },
          parent: { directly_related_user_types: [{ type: 'org' }] },
        },
      },
    },
    {
      type: 'room',
      relations: {
        owner: {
          this: {},
        },
        member: {
          union: {
            child: [
              { this: {} },
              { computedUserset: { relation: 'owner' } },
              { tupleToUserset: { tupleset: { relation: 'parent' }, computedUserset: { relation: 'member' } } },
            ],
          },
        },
        viewer: {
          union: {
            child: [
              { this: {} },
              { computedUserset: { relation: 'member' } },
            ],
          },
        },
        parent: {
          this: {},
        },
      },
      metadata: {
        relations: {
          owner: { directly_related_user_types: [{ type: 'user' }] },
          member: { directly_related_user_types: [{ type: 'user' }] },
          viewer: { directly_related_user_types: [{ type: 'user' }] },
          parent: { directly_related_user_types: [{ type: 'workspace' }] },
        },
      },
    },
    {
      type: 'agent',
      relations: {
        can_invoke: {
          union: {
            child: [
              { this: {} },
              { tupleToUserset: { tupleset: { relation: 'parent' }, computedUserset: { relation: 'member' } } },
            ],
          },
        },
        parent: {
          this: {},
        },
      },
      metadata: {
        relations: {
          can_invoke: { directly_related_user_types: [{ type: 'user' }] },
          parent: { directly_related_user_types: [{ type: 'workspace' }] },
        },
      },
    },
    {
      type: 'package',
      relations: {
        can_install: {
          union: {
            child: [
              { this: {} },
              { tupleToUserset: { tupleset: { relation: 'parent' }, computedUserset: { relation: 'member' } } },
            ],
          },
        },
        parent: {
          this: {},
        },
      },
      metadata: {
        relations: {
          can_install: { directly_related_user_types: [{ type: 'user' }] },
          parent: { directly_related_user_types: [{ type: 'workspace' }] },
        },
      },
    },
    {
      type: 'mcp_server',
      relations: {
        can_invoke: {
          union: {
            child: [
              { this: {} },
              { tupleToUserset: { tupleset: { relation: 'parent' }, computedUserset: { relation: 'member' } } },
            ],
          },
        },
        parent: {
          this: {},
        },
      },
      metadata: {
        relations: {
          can_invoke: { directly_related_user_types: [{ type: 'user' }] },
          parent: { directly_related_user_types: [{ type: 'workspace' }] },
        },
      },
    },
  ],
};
