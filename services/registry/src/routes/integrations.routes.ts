import type { FastifyInstance } from 'fastify';

/**
 * Stub routes for /api/v1/integrations — returns mock data so the Office UI
 * doesn't 404. Will be backed by a real DB table in a future phase.
 */
export function registerIntegrationRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { category?: string } }>('/api/v1/integrations', async (request) => {
    const { category } = request.query;
    const all = [
      {
        id: 'int-github',
        workspace_id: 'default',
        name: 'GitHub',
        category: 'development',
        integration_type: 'github',
        status: 'active',
        settings: {},
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'int-slack',
        workspace_id: 'default',
        name: 'Slack',
        category: 'communication',
        integration_type: 'slack',
        status: 'disconnected',
        settings: {},
        connected_at: null,
        last_synced_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    return category ? all.filter(i => i.category === category) : all;
  });

  app.post('/api/v1/integrations', async (_request, reply) => {
    reply.status(201).send({ id: 'int-stub', status: 'active' });
  });

  app.post<{ Params: { id: string } }>('/api/v1/integrations/:id/reconnect', async (request) => {
    return { id: request.params.id, status: 'active' };
  });

  app.post('/api/v1/integrations/mcp', async (_request, reply) => {
    reply.status(201).send({ id: 'mcp-stub', status: 'active' });
  });

  app.delete<{ Params: { id: string } }>('/api/v1/integrations/mcp/:id', async (_request, reply) => {
    reply.status(204).send();
  });

  // Sandbox MCP stubs
  app.get('/api/v1/sandbox/mcp', async () => []);
  app.get('/api/v1/sandbox/tools', async () => []);
  app.post<{ Params: { id: string } }>('/api/v1/sandbox/mcp/:id/enable', async () => ({ ok: true }));
  app.post<{ Params: { id: string } }>('/api/v1/sandbox/mcp/:id/disable', async () => ({ ok: true }));
  app.post('/api/v1/sandbox/mcp/refresh', async () => ({ ok: true }));
  app.post('/api/v1/sandbox/mcp', async (_request, reply) => { reply.status(201).send({ ok: true }); });
  app.delete<{ Params: { id: string } }>('/api/v1/sandbox/mcp/:id', async (_request, reply) => { reply.status(204).send(); });
  app.post<{ Params: { name: string } }>('/api/v1/sandbox/tools/:name/toggle', async () => ({ ok: true }));
}
