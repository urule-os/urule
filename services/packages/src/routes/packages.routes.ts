import type { FastifyInstance } from 'fastify';
import type { PackageManager } from '../services/package-manager.js';
import type { PackageInstallRequest } from '../types.js';

export function registerPackageRoutes(app: FastifyInstance, manager: PackageManager): void {
  app.post<{
    Body: PackageInstallRequest;
  }>('/api/v1/packages/install', async (request, reply) => {
    const body = request.body;

    if (!body.workspaceId || !body.packageName) {
      return reply.status(400).send({ error: 'workspaceId and packageName are required' });
    }

    try {
      const installation = await manager.install(body);
      return reply.status(201).send(installation);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Install failed';
      return reply.status(409).send({ error: message });
    }
  });

  app.post<{
    Params: { installId: string };
    Body: { version?: string };
  }>('/api/v1/packages/:installId/upgrade', async (request, reply) => {
    const { installId } = request.params;
    const { version } = request.body ?? {};

    try {
      const installation = await manager.upgrade(installId, version);
      return installation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upgrade failed';
      if (message.includes('not found')) {
        return reply.status(404).send({ error: message });
      }
      return reply.status(409).send({ error: message });
    }
  });

  app.delete<{
    Params: { installId: string };
  }>('/api/v1/packages/:installId', async (request, reply) => {
    const { installId } = request.params;

    try {
      await manager.remove(installId);
      return reply.status(204).send();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Remove failed';
      return reply.status(404).send({ error: message });
    }
  });
}
