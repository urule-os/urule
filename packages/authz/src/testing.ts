import type { AuthzClient, CheckResult, RelationTuple } from './types.js';

/**
 * In-memory mock AuthzClient for testing.
 *
 * Stores tuples in memory and performs simple direct-match checks.
 * Does NOT evaluate inheritance / computed usersets — only direct tuples.
 */
export function createMockAuthzClient(): AuthzClient & {
  /** Access the internal tuple store for assertions */
  readonly tuples: RelationTuple[];
  /** Reset all stored tuples */
  reset(): void;
} {
  let tuples: RelationTuple[] = [];

  return {
    get tuples() {
      return tuples;
    },

    reset() {
      tuples = [];
    },

    async check(user: string, relation: string, object: string): Promise<CheckResult> {
      const found = tuples.some(
        (t) => t.user === user && t.relation === relation && t.object === object,
      );
      return { allowed: found };
    },

    async writeTuples(newTuples: RelationTuple[]): Promise<void> {
      tuples.push(...newTuples);
    },

    async deleteTuples(toDelete: RelationTuple[]): Promise<void> {
      for (const del of toDelete) {
        const idx = tuples.findIndex(
          (t) => t.user === del.user && t.relation === del.relation && t.object === del.object,
        );
        if (idx !== -1) {
          tuples.splice(idx, 1);
        }
      }
    },

    async listObjects(user: string, relation: string, type: string): Promise<string[]> {
      return tuples
        .filter((t) => t.user === user && t.relation === relation && t.object.startsWith(`${type}:`))
        .map((t) => t.object);
    },

    async listRelations(user: string, object: string): Promise<string[]> {
      return tuples
        .filter((t) => t.user === user && t.object === object)
        .map((t) => t.relation);
    },

    async ensureModel(): Promise<string> {
      return 'mock-model-id';
    },
  };
}
