/** Event payloads for registry domain events */

export interface OrgCreatedEvent {
  orgId: string;
  name: string;
  slug: string;
}

export interface OrgUpdatedEvent {
  orgId: string;
  changes: Record<string, unknown>;
}

export interface OrgDeletedEvent {
  orgId: string;
}

export interface WorkspaceCreatedEvent {
  workspaceId: string;
  orgId: string;
  name: string;
  slug: string;
}

export interface WorkspaceUpdatedEvent {
  workspaceId: string;
  changes: Record<string, unknown>;
}

export interface WorkspaceDeletedEvent {
  workspaceId: string;
}

export interface RoomCreatedEvent {
  roomId: string;
  workspaceId: string;
  name: string;
  type: string;
}

export interface AgentRegisteredEvent {
  agentId: string;
  workspaceId: string;
  name: string;
}

export interface AgentUpdatedEvent {
  agentId: string;
  changes: Record<string, unknown>;
}

export interface RuntimeRegisteredEvent {
  runtimeId: string;
  workspaceId: string;
  provider: string;
  profile: string;
}
