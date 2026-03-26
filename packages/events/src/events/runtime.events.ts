/** Event payloads for runtime domain events */

export interface SessionAllocatedEvent {
  sessionId: string;
  workspaceId: string;
  runtimeId: string;
  provider: string;
}

export interface SessionReadyEvent {
  sessionId: string;
}

export interface SessionTerminatedEvent {
  sessionId: string;
  reason: string;
}

export interface SessionErrorEvent {
  sessionId: string;
  error: string;
}
