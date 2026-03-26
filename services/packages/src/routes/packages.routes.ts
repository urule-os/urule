import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { PackageManager } from '../services/package-manager.js';
import type { PackageInstallRequest } from '../types.js';

const installPackageSchema = z.object({
  workspaceId: z.string(),
  packageName: z.string().min(1),
  version: z.string().optional(),
  source: z.object({}).passthrough().optional(),
});

const upgradePackageSchema = z.object({
  version: z.string().optional(),
});

export function registerPackageRoutes(app: FastifyInstance, manager: PackageManager): void {
  app.post<{
    Body: PackageInstallRequest;
  }>('/api/v1/packages/install', async (request, reply) => {
    const parsed = installPackageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }
    const body = parsed.data as PackageInstallRequest;

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
    const parsed = upgradePackageSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }
    const { installId } = request.params;
    const { version } = parsed.data;

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
