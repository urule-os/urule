/**
 * Relation constants used across the Urule authorization model.
 */
export const RELATIONS = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
  CAN_INVOKE: 'can_invoke',
  CAN_INSTALL: 'can_install',
  CAN_APPROVE: 'can_approve',
  PARENT: 'parent',
} as const;

/** Union type of all known relation values */
export type Relation = (typeof RELATIONS)[keyof typeof RELATIONS];
