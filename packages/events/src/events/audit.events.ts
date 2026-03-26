export interface AuditEvent {
  /** Who performed the action (user ID or 'system') */
  actorId: string;
  /** Actor display name */
  actorName: string;
  /** What action was taken */
  action: string;
  /** What entity type was affected */
  entityType: string;
  /** ID of the affected entity */
  entityId: string;
  /** Service that recorded the audit event */
  service: string;
  /** Workspace context */
  workspaceId?: string;
  /** Human-readable description */
  description: string;
  /** Before/after diff for updates */
  changes?: Record<string, { before?: unknown; after?: unknown }>;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}
