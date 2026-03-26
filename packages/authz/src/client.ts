import { OpenFgaClient } from '@openfga/sdk';
import { ulid } from 'ulid';
import { URULE_AUTH_MODEL } from './model.js';
import type { AuthzClient, AuthzConfig, CheckResult, EntityType, RelationTuple } from './types.js';

/**
 * Convert a RelationTuple to the OpenFGA SDK tuple key format.
 */
function toTupleKey(tuple: RelationTuple) {
  const key: { user: string; relation: string; object: string; condition?: { name: string; context: Record<string, unknown> } } = {
    user: tuple.user,
    relation: tuple.relation,
    object: tuple.object,
  };
  if (tuple.condition) {
    key.condition = tuple.condition;
  }
  return key;
}

/**
 * Create an AuthzClient wrapping the OpenFGA SDK.
 *
 * @param config - Connection configuration for the OpenFGA store
 * @param fgaClient - Optional pre-built OpenFgaClient (for testing/DI)
 * @returns An AuthzClient instance
 */
export function createAuthzClient(config: AuthzConfig, fgaClient?: OpenFgaClient): AuthzClient {
  const client = fgaClient ?? new OpenFgaClient({
    apiUrl: config.apiUrl,
    storeId: config.storeId,
    authorizationModelId: config.modelId,
  });

  return {
    async check(user: string, relation: string, object: string): Promise<CheckResult> {
      const response = await client.check({
        user,
        relation,
        object,
      });

      return {
        allowed: response.allowed ?? false,
        resolution: response.resolution ?? undefined,
      };
    },

    async writeTuples(tuples: RelationTuple[]): Promise<void> {
      await client.write({
        writes: tuples.map(toTupleKey),
      });
    },

    async deleteTuples(tuples: RelationTuple[]): Promise<void> {
      await client.write({
        deletes: tuples.map(toTupleKey),
      });
    },

    async listObjects(user: string, relation: string, type: EntityType): Promise<string[]> {
      const response = await client.listObjects({
        user,
        relation,
        type,
      });

      return response.objects ?? [];
    },

    async listRelations(user: string, object: string): Promise<string[]> {
      // OpenFGA SDK does not have a direct listRelations method,
      // so we use batchCheck across known relations for the object type.
      const objectType = object.split(':')[0] ?? '';
      const relationsToCheck = getRelationsForType(objectType);

      const results: string[] = [];
      for (const relation of relationsToCheck) {
        const response = await client.check({ user, relation, object });
        if (response.allowed) {
          results.push(relation);
        }
      }

      return results;
    },

    async ensureModel(): Promise<string> {
      const response = await client.writeAuthorizationModel(
        URULE_AUTH_MODEL as unknown as Parameters<OpenFgaClient['writeAuthorizationModel']>[0],
      );

      const modelId = response.authorization_model_id ?? ulid();
      return modelId;
    },
  };
}

/**
 * Return the known relations for a given entity type.
 */
function getRelationsForType(type: string): string[] {
  switch (type) {
    case 'org':
      return ['owner', 'admin', 'member'];
    case 'workspace':
      return ['owner', 'admin', 'member', 'viewer', 'parent'];
    case 'room':
      return ['owner', 'member', 'viewer', 'parent'];
    case 'agent':
      return ['can_invoke', 'parent'];
    case 'package':
      return ['can_install', 'parent'];
    case 'mcp_server':
      return ['can_invoke', 'parent'];
    default:
      return [];
  }
}
