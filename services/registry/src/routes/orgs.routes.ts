import type { FastifyInstance } from 'fastify';
import { ulid } from 'ulid';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/connection.js';
import { orgs } from '../db/schema/orgs.js';

export function registerOrgRoutes(app: FastifyInstance, db: Database) {
  // List orgs
  app.get('/api/v1/orgs', async () => {
    return db.select().from(orgs);
  });

  // Create org
  app.post<{ Body: { name: string; slug: string } }>('/api/v1/orgs', async (request, reply) => {
    const { name, slug } = request.body;
    const id = ulid();
    const now = new Date();

    const [org] = await db.insert(orgs).values({
      id,
      name,
      slug,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }).returning();

    reply.status(201).send(org);
  });

  // Get org by ID
  app.get<{ Params: { orgId: string } }>('/api/v1/orgs/:orgId', async (request, reply) => {
    const { orgId } = request.params;
    const [org] = await db.select().from(orgs).where(eq(orgs.id, orgId));

    if (!org) {
      reply.status(404).send({ error: { code: 'ORG_NOT_FOUND', message: `Org ${orgId} not found` } });
      return;
    }

    return org;
  });
}
