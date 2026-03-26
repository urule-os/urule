// Core client factory
export { createAuthzClient } from './client.js';

// Authorization model
export { URULE_AUTH_MODEL } from './model.js';

// Relation constants
export { RELATIONS } from './relations.js';
export type { Relation } from './relations.js';

// Tuple helpers
export {
  orgTuple,
  workspaceTuple,
  agentTuple,
  roomTuple,
  packageTuple,
  mcpServerTuple,
  parentTuple,
} from './tuples.js';

// Types
export type {
  AuthzConfig,
  AuthzClient,
  RelationTuple,
  CheckResult,
  EntityType,
} from './types.js';
