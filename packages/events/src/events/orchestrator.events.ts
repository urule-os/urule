/** Event payloads for orchestrator domain events */

export interface RunStartedEvent {
  runId: string;
  workspaceId: string;
  agentId: string;
  orchestratorType: string;
}

export interface RunPausedEvent {
  runId: string;
  reason: string;
  approvalId?: string;
}

export interface RunResumedEvent {
  runId: string;
}

export interface RunCompletedEvent {
  runId: string;
  output?: Record<string, unknown>;
}

export interface RunFailedEvent {
  runId: string;
  error: string;
}

export interface RunCancelledEvent {
  runId: string;
  reason: string;
}

export interface ArtifactEmittedEvent {
  runId: string;
  artifactId: string;
  type: string;
  name: string;
}
