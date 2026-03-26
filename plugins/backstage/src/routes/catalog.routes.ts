import type { FastifyInstance } from 'fastify';
import type { CatalogSyncService } from '../catalog/sync-service.js';
import type { ScaffolderAction } from '../scaffolder/actions.js';

export async function catalogRoutes(
  app: FastifyInstance,
  opts: { syncService: CatalogSyncService; scaffolderActions: ScaffolderAction[] },
): Promise<void> {
  const { syncService, scaffolderActions } = opts;

  // Trigger a catalog sync
  app.post('/api/v1/catalog/sync', async (_request, reply) => {
    const result = await syncService.sync();
    return reply.send(result);
  });

  // Get sync status
  app.get('/api/v1/catalog/status', async () => {
    return {
      lastSyncAt: syncService.getLastSyncAt(),
      status: 'ready',
    };
  });

  // Get catalog entities (last synced)
  app.get('/api/v1/catalog/entities', async () => {
    const result = await syncService.sync();
    return result.entities;
  });

  // List available scaffolder actions
  app.get('/api/v1/scaffolder/actions', async () => {
    return scaffolderActions;
  });
}
