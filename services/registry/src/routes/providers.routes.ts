import type { FastifyInstance } from 'fastify';
import { ulid } from 'ulid';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/connection.js';
import { providers } from '../db/schema/providers.js';
import { workspaces } from '../db/schema/workspaces.js';

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return key.slice(0, 5) + '...' + key.slice(-4);
}

/** Transform a Drizzle provider row to UI-expected snake_case. */
function toUiProvider(row: Record<string, unknown>, mask = true) {
  return {
    id: row.id,
    workspace_id: row.workspaceId,
    name: row.name,
    provider: row.provider,
    model_name: row.modelName,
    api_key: mask ? maskApiKey(row.apiKey as string) : row.apiKey,
    base_url: row.baseUrl,
    is_default: row.isDefault,
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function registerProviderRoutes(app: FastifyInstance, db: Database) {
  // List providers (optionally filtered by workspaceId query param)
  app.get<{ Querystring: { workspaceId?: string } }>('/api/v1/providers', async (request) => {
    const { workspaceId } = request.query;
    const rows = workspaceId
      ? await db.select().from(providers).where(eq(providers.workspaceId, workspaceId))
      : await db.select().from(providers);
    return rows.map(p => toUiProvider(p as Record<string, unknown>));
  });

  // Create provider (accepts both snake_case and camelCase fields)
  app.post<{
    Body: Record<string, unknown>;
  }>('/api/v1/providers', async (request, reply) => {
    const b = request.body;
    let workspaceId = (b.workspaceId ?? b.workspace_id ?? '') as string;
    // Resolve to actual workspace if not provided
    if (!workspaceId || workspaceId === 'default') {
      const [ws] = await db.select().from(workspaces).limit(1);
      workspaceId = ws?.id ?? 'default';
    }
    const name = b.name as string;
    const provider = b.provider as string;
    const modelName = (b.modelName ?? b.model_name ?? '') as string;
    const apiKey = (b.apiKey ?? b.api_key ?? '') as string;
    const baseUrl = (b.baseUrl ?? b.base_url ?? '') as string;
    const isDefault = (b.isDefault ?? b.is_default ?? false) as boolean;

    const id = ulid();
    const now = new Date();

    // If marking as default, unset other defaults for this workspace
    if (isDefault) {
      await db.update(providers)
        .set({ isDefault: false, updatedAt: now })
        .where(eq(providers.workspaceId, workspaceId));
    }

    const [row] = await db.insert(providers).values({
      id,
      workspaceId,
      name,
      provider,
      modelName,
      apiKey,
      baseUrl,
      isDefault,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }).returning();

    if (!row) {
      reply.status(500).send({ error: { code: 'INSERT_FAILED', message: 'Failed to create provider' } });
      return;
    }
    reply.status(201).send(toUiProvider(row as Record<string, unknown>));
  });

  // Get single provider (masked key)
  app.get<{ Params: { providerId: string } }>('/api/v1/providers/:providerId', async (request, reply) => {
    const { providerId } = request.params;
    const [row] = await db.select().from(providers).where(eq(providers.id, providerId));
    if (!row) {
      reply.status(404).send({ error: { code: 'PROVIDER_NOT_FOUND', message: `Provider ${providerId} not found` } });
      return;
    }
    return toUiProvider(row as Record<string, unknown>);
  });

  // Get provider's real API key (internal use by adapter service)
  app.get<{ Params: { providerId: string } }>('/api/v1/providers/:providerId/key', async (request, reply) => {
    const { providerId } = request.params;
    const [row] = await db.select().from(providers).where(eq(providers.id, providerId));
    if (!row) {
      reply.status(404).send({ error: { code: 'PROVIDER_NOT_FOUND', message: `Provider ${providerId} not found` } });
      return;
    }
    return { apiKey: row.apiKey, provider: row.provider, modelName: row.modelName };
  });

  // Update provider
  app.patch<{ Params: { providerId: string }; Body: Record<string, unknown> }>(
    '/api/v1/providers/:providerId',
    async (request, reply) => {
      const { providerId } = request.params;
      const b = request.body;

      // Map snake_case to camelCase for Drizzle
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (b.name !== undefined) updates.name = b.name;
      if (b.provider !== undefined) updates.provider = b.provider;
      if (b.modelName !== undefined || b.model_name !== undefined) updates.modelName = b.modelName ?? b.model_name;
      if (b.apiKey !== undefined || b.api_key !== undefined) updates.apiKey = b.apiKey ?? b.api_key;
      if (b.baseUrl !== undefined || b.base_url !== undefined) updates.baseUrl = b.baseUrl ?? b.base_url;
      if (b.isDefault !== undefined || b.is_default !== undefined) updates.isDefault = b.isDefault ?? b.is_default;
      if (b.isActive !== undefined || b.is_active !== undefined) updates.isActive = b.isActive ?? b.is_active;

      const [row] = await db
        .update(providers)
        .set(updates)
        .where(eq(providers.id, providerId))
        .returning();

      if (!row) {
        reply.status(404).send({ error: { code: 'PROVIDER_NOT_FOUND', message: `Provider ${providerId} not found` } });
        return;
      }

      return toUiProvider(row as Record<string, unknown>);
    },
  );

  // Delete provider
  app.delete<{ Params: { providerId: string } }>('/api/v1/providers/:providerId', async (request, reply) => {
    const { providerId } = request.params;
    const [row] = await db.delete(providers).where(eq(providers.id, providerId)).returning();
    if (!row) {
      reply.status(404).send({ error: { code: 'PROVIDER_NOT_FOUND', message: `Provider ${providerId} not found` } });
      return;
    }
    reply.status(204).send();
  });
}
