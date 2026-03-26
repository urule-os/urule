import type { FastifyInstance } from 'fastify';

/**
 * Stub routes for /api/v1/logs and /api/v1/notifications — returns mock data
 * so the Office UI doesn't 404. Will be backed by a real event store later.
 */
export function registerLogRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { actor_type?: string; event_type?: string; search?: string; limit?: string } }>(
    '/api/v1/logs',
    async (request) => {
      const limit = parseInt(request.query.limit ?? '50', 10);
      const now = new Date().toISOString();
      const logs = [
        {
          id: 'log-1',
          workspace_id: 'default',
          actor_id: 'system',
          actor_type: 'system',
          event_type: 'info',
          title: 'Phase 6 stack started',
          description: 'All services are healthy and running',
          metadata_json: {},
          created_at: now,
        },
        {
          id: 'log-2',
          workspace_id: 'default',
          actor_id: 'system',
          actor_type: 'system',
          event_type: 'success',
          title: 'Database initialized',
          description: 'Registry and PackageHub schemas created',
          metadata_json: {},
          created_at: now,
        },
      ];
      return logs.slice(0, limit);
    },
  );

  app.get('/api/v1/notifications', async () => []);

  app.patch<{ Params: { id: string } }>('/api/v1/notifications/:id/read', async (request) => {
    return { id: request.params.id, is_read: true };
  });
}
