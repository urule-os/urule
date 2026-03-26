import type { FastifyInstance } from 'fastify';
import { ulid } from 'ulid';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Database } from '../db/connection.js';
import { workspaces } from '../db/schema/workspaces.js';

const createWorkspaceSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
}).strict();

/** Transform Drizzle workspace row to UI-expected snake_case. */
function toUiWorkspace(row: Record<string, unknown>) {
  return {
    id: row.id,
    organization_id: row.orgId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
    is_default: true,
    human_in_the_loop: false,
    guardrails: {
      human_approval_required: true,
      auto_scale_compute: false,
      audit_log_persistence: true,
      dark_launch_protocol: false,
    },
    settings: {},
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function registerWorkspaceRoutes(app: FastifyInstance, db: Database) {
  // List all workspaces
  app.get('/api/v1/workspaces', async () => {
    const rows = await db.select().from(workspaces);
    return rows.map(row => toUiWorkspace(row as Record<string, unknown>));
  });

  // Get "current" workspace — returns the first workspace (demo mode)
  app.get('/api/v1/workspaces/current', async (request, reply) => {
    const rows = await db.select().from(workspaces).limit(1);
    if (rows.length === 0) {
      reply.status(404).send({ error: { code: 'NO_WORKSPACE', message: 'No workspace configured' } });
      return;
    }
    return toUiWorkspace(rows[0] as Record<string, unknown>);
  });

  // Get workspace setup status (demo: always complete)
  app.get('/api/v1/workspaces/current/setup-status', async () => {
    return { is_setup_complete: true, complete: true, steps: [] };
  });

  // Update current workspace (for settings page)
  app.patch('/api/v1/workspaces/current', async (request, reply) => {
    const parsed = updateWorkspaceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }
    const rows = await db.select().from(workspaces).limit(1);
    if (rows.length === 0) {
      reply.status(404).send({ error: { code: 'NO_WORKSPACE', message: 'No workspace configured' } });
      return;
    }
    const updates = parsed.data as Record<string, unknown>;
    const [updated] = await db.update(workspaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workspaces.id, rows[0]!.id))
      .returning();
    return toUiWorkspace(updated as Record<string, unknown>);
  });

  // Update current workspace guardrails
  app.patch('/api/v1/workspaces/current/guardrails', async (request, reply) => {
    // In demo mode, just acknowledge the update
    reply.send({ ok: true });
  });

  // List workspaces for an org
  app.get<{ Params: { orgId: string } }>('/api/v1/orgs/:orgId/workspaces', async (request) => {
    const { orgId } = request.params;
    const rows = await db.select().from(workspaces).where(eq(workspaces.orgId, orgId));
    return rows.map(row => toUiWorkspace(row as Record<string, unknown>));
  });

  // Create workspace
  app.post<{ Body: { orgId: string; name: string; slug: string; description?: string } }>(
    '/api/v1/workspaces',
    async (request, reply) => {
      const parsed = createWorkspaceSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues });
      }
      const { orgId, name, slug, description } = parsed.data;
      const id = ulid();
      const now = new Date();

      const [workspace] = await db.insert(workspaces).values({
        id,
        orgId,
        name,
        slug,
        description: description ?? '',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }).returning();

      reply.status(201).send(toUiWorkspace(workspace as Record<string, unknown>));
    },
  );

  // Get workspace by ID
  app.get<{ Params: { wsId: string } }>('/api/v1/workspaces/:wsId', async (request, reply) => {
    const { wsId } = request.params;
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, wsId));

    if (!workspace) {
      reply.status(404).send({ error: { code: 'WORKSPACE_NOT_FOUND', message: `Workspace ${wsId} not found` } });
      return;
    }

    return toUiWorkspace(workspace as Record<string, unknown>);
  });
}
