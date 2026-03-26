/**
 * Configuration for creating an AuthzClient.
 */
export interface AuthzConfig {
  /** OpenFGA API URL */
  apiUrl: string;
  /** OpenFGA store ID */
  storeId: string;
  /** Optional authorization model ID — if omitted, uses the latest model in the store */
  modelId?: string;
}

/**
 * Represents a relation tuple linking a user to an object via a relation.
 */
export interface RelationTuple {
  /** The user (subject) of the relation, e.g. "user:alice" */
  user: string;
  /** The relation name, e.g. "member" */
  relation: string;
  /** The object of the relation, e.g. "org:acme" */
  object: string;
  /** Optional condition attached to the tuple */
  condition?: {
    name: string;
    context: Record<string, unknown>;
  };
}

/**
 * Result of an authorization check.
 */
export interface CheckResult {
  /** Whether the user is allowed the relation on the object */
  allowed: boolean;
  /** Optional resolution trace for debugging */
  resolution?: string;
}

/**
 * Entity types in the Urule authorization model.
 */
export type EntityType = 'org' | 'workspace' | 'room' | 'agent' | 'package' | 'mcp_server';

/**
 * The AuthzClient interface wrapping OpenFGA operations.
 */
export interface AuthzClient {
  /** Check whether a user has a relation on an object */
  check(user: string, relation: string, object: string): Promise<CheckResult>;
  /** Write (create) relation tuples */
  writeTuples(tuples: RelationTuple[]): Promise<void>;
  /** Delete relation tuples */
  deleteTuples(tuples: RelationTuple[]): Promise<void>;
  /** List objects of a given type that a user has a relation to */
  listObjects(user: string, relation: string, type: EntityType): Promise<string[]>;
  /** List relations a user has on an object */
  listRelations(user: string, object: string): Promise<string[]>;
  /** Ensure the authorization model exists in the store; returns the model ID */
  ensureModel(): Promise<string>;
}
