import type { EntityType, RelationTuple } from './types.js';

/**
 * Create a relation tuple for an org.
 */
export function orgTuple(userId: string, relation: string, orgId: string): RelationTuple {
  return {
    user: `user:${userId}`,
    relation,
    object: `org:${orgId}`,
  };
}

/**
 * Create a relation tuple for a workspace.
 */
export function workspaceTuple(userId: string, relation: string, wsId: string): RelationTuple {
  return {
    user: `user:${userId}`,
    relation,
    object: `workspace:${wsId}`,
  };
}

/**
 * Create a relation tuple for an agent.
 */
export function agentTuple(userId: string, relation: string, agentId: string): RelationTuple {
  return {
    user: `user:${userId}`,
    relation,
    object: `agent:${agentId}`,
  };
}

/**
 * Create a relation tuple for a room.
 */
export function roomTuple(userId: string, relation: string, roomId: string): RelationTuple {
  return {
    user: `user:${userId}`,
    relation,
    object: `room:${roomId}`,
  };
}

/**
 * Create a relation tuple for a package.
 */
export function packageTuple(userId: string, relation: string, packageId: string): RelationTuple {
  return {
    user: `user:${userId}`,
    relation,
    object: `package:${packageId}`,
  };
}

/**
 * Create a relation tuple for an MCP server.
 */
export function mcpServerTuple(userId: string, relation: string, serverId: string): RelationTuple {
  return {
    user: `user:${userId}`,
    relation,
    object: `mcp_server:${serverId}`,
  };
}

/**
 * Create a parent relation tuple linking a child entity to its parent.
 * For example, linking a workspace to its parent org.
 */
export function parentTuple(
  childType: EntityType,
  childId: string,
  parentType: EntityType,
  parentId: string,
): RelationTuple {
  return {
    user: `${parentType}:${parentId}`,
    relation: 'parent',
    object: `${childType}:${childId}`,
  };
}
