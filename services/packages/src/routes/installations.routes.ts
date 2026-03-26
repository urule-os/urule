import type { FastifyInstance } from 'fastify';
import type { PackageManager } from '../services/package-manager.js';

export function registerInstallationRoutes(app: FastifyInstance, manager: PackageManager): void {
  app.get<{
    Params: { wsId: string };
  }>('/api/v1/workspaces/:wsId/packages', async (request) => {
    const { wsId } = request.params;
    const packages = await manager.list(wsId);
    return { packages };
  });

  app.get<{
    Params: { installId: string };
  }>('/api/v1/packages/:installId', async (request, reply) => {
    const { installId } = request.params;
    try {
      const installation = await manager.getStatus(installId);
      return installation;
    } catch {
      return reply.status(404).send({ error: 'Installation not found' });
    }
  });
}
