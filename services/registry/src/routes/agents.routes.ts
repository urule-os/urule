import type { FastifyInstance } from 'fastify';
import { ulid } from 'ulid';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/connection.js';
import { agents } from '../db/schema/agents.js';
import { providers } from '../db/schema/providers.js';
import { workspaces } from '../db/schema/workspaces.js';

/** Transform a Drizzle agent row into the shape the UI expects (snake_case + derived fields). */
function toUiAgent(row: Record<string, unknown>, provider?: Record<string, unknown> | null) {
  const config = (row.config ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    workspace_id: row.workspaceId,
    name: row.name,
    description: row.description,
    role: config.role ?? '',
    category: config.category ?? '',
    system_prompt: config.systemPrompt ?? '',
    avatar_url: config.avatarUrl ?? '',
    accent_color: config.accentColor ?? '#0db9f2',
    package_id: row.personalityPackId ?? null,
    package_version: null,
    status: row.status,
    is_active: row.status !== 'offline',
    office_position: null,
    tool_permissions: config.toolPermissions ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    config,
    model_provider: provider ? {
      id: provider.id,
      workspace_id: provider.workspaceId,
      name: provider.name,
      provider: provider.provider,
      model_name: provider.modelName,
      base_url: provider.baseUrl,
      is_default: provider.isDefault,
      is_active: provider.isActive,
      created_at: provider.createdAt,
    } : null,
  };
}

export function registerAgentRoutes(app: FastifyInstance, db: Database) {
  // List all agents (across all workspaces)
  app.get('/api/v1/agents', async () => {
    const rows = await db.select().from(agents);
    return Promise.all(rows.map(async (row) => {
      const config = (row.config ?? {}) as Record<string, unknown>;
      const providerId = config.provider_id as string | undefined;
      let provider = null;
      if (providerId) {
        const [p] = await db.select().from(providers).where(eq(providers.id, providerId));
        provider = p ?? null;
      }
      return toUiAgent(row as Record<string, unknown>, provider);
    }));
  });

  // List agents for a workspace
  app.get<{ Params: { wsId: string } }>('/api/v1/workspaces/:wsId/agents', async (request) => {
    const { wsId } = request.params;
    const rows = await db.select().from(agents).where(eq(agents.workspaceId, wsId));
    return rows.map(row => toUiAgent(row as Record<string, unknown>));
  });

  // Register agent
  app.post<{
    Body: { workspaceId?: string; name: string; description?: string; config?: Record<string, unknown> };
  }>('/api/v1/agents', async (request, reply) => {
    let { workspaceId } = request.body;
    const { name, description, config } = request.body;
    // Resolve workspace if not provided
    if (!workspaceId || workspaceId === 'default') {
      const [ws] = await db.select().from(workspaces).limit(1);
      workspaceId = ws?.id ?? 'default';
    }
    const id = ulid();
    const now = new Date();

    const [agent] = await db.insert(agents).values({
      id,
      workspaceId,
      name,
      description: description ?? '',
      skillPacks: [],
      mcpBindings: [],
      status: 'idle',
      config: config ?? {},
      createdAt: now,
      updatedAt: now,
    }).returning();

    reply.status(201).send(toUiAgent(agent as Record<string, unknown>));
  });

  // Get agent by ID
  app.get<{ Params: { agentId: string } }>('/api/v1/agents/:agentId', async (request, reply) => {
    const { agentId } = request.params;
    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));

    if (!agent) {
      reply.status(404).send({ error: { code: 'AGENT_NOT_FOUND', message: `Agent ${agentId} not found` } });
      return;
    }

    const config = (agent.config ?? {}) as Record<string, unknown>;
    const providerId = config.provider_id as string | undefined;
    let provider = null;
    if (providerId) {
      const [p] = await db.select().from(providers).where(eq(providers.id, providerId));
      provider = p ?? null;
    }

    return toUiAgent(agent as Record<string, unknown>, provider);
  });

  // Agent metrics stub
  app.get<{ Params: { agentId: string } }>('/api/v1/agents/:agentId/metrics', async () => ({
    tasks_completed: 0,
    tasks_in_progress: 0,
    avg_response_time_ms: 0,
    messages_sent: 0,
    uptime_pct: 100,
  }));

  // Agent health stub
  app.get<{ Params: { agentId: string } }>('/api/v1/agents/:agentId/health', async () => ({
    status: 'healthy',
    last_heartbeat: new Date().toISOString(),
    memory_usage_mb: 0,
    cpu_pct: 0,
  }));

  // Agent conversations stub
  app.get<{ Params: { agentId: string } }>('/api/v1/agents/:agentId/conversations', async () => []);

  // Agent logs stub
  app.get<{ Params: { agentId: string } }>('/api/v1/agents/:agentId/logs', async () => []);

  // Agent memories stub
  app.get<{ Params: { agentId: string } }>('/api/v1/agents/:agentId/memories', async () => []);
  app.post<{ Params: { agentId: string } }>('/api/v1/agents/:agentId/memories', async (_req, reply) => {
    reply.status(201).send({ id: 'mem-stub', content: '', created_at: new Date().toISOString() });
  });
  app.delete<{ Params: { agentId: string; memoryId: string } }>('/api/v1/agents/:agentId/memories/:memoryId', async (_req, reply) => {
    reply.status(204).send();
  });

  // Agent status update
  app.post<{ Params: { agentId: string }; Body: { status: string } }>(
    '/api/v1/agents/:agentId/status',
    async (request, reply) => {
      const { agentId } = request.params;
      const { status } = request.body;
      const [agent] = await db
        .update(agents)
        .set({ status, updatedAt: new Date() })
        .where(eq(agents.id, agentId))
        .returning();
      if (!agent) {
        reply.status(404).send({ error: { code: 'AGENT_NOT_FOUND', message: `Agent ${agentId} not found` } });
        return;
      }
      return toUiAgent(agent as Record<string, unknown>);
    },
  );

  // Update agent
  app.patch<{ Params: { agentId: string }; Body: Record<string, unknown> }>(
    '/api/v1/agents/:agentId',
    async (request, reply) => {
      const { agentId } = request.params;
      const updates = request.body;

      const [agent] = await db
        .update(agents)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(agents.id, agentId))
        .returning();

      if (!agent) {
        reply.status(404).send({ error: { code: 'AGENT_NOT_FOUND', message: `Agent ${agentId} not found` } });
        return;
      }

      return toUiAgent(agent as Record<string, unknown>);
    },
  );
}
