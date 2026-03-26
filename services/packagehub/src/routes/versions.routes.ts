import type { FastifyInstance } from 'fastify';
import { ulid } from 'ulid';
import { eq, and, desc } from 'drizzle-orm';
import type { Database } from '../db/connection.js';
import { packages } from '../db/schema/packages.js';
import { packageVersions } from '../db/schema/versions.js';

export function registerVersionRoutes(app: FastifyInstance, db: Database) {
  // List versions for a package
  app.get<{ Params: { name: string } }>(
    '/api/v1/packages/:name/versions',
    async (request, reply) => {
      const { name } = request.params;

      const [pkg] = await db.select().from(packages).where(eq(packages.name, name));
      if (!pkg) {
        reply.status(404).send({
          error: { code: 'PACKAGE_NOT_FOUND', message: `Package "${name}" not found` },
        });
        return;
      }

      return db
        .select()
        .from(packageVersions)
        .where(eq(packageVersions.packageId, pkg.id))
        .orderBy(desc(packageVersions.publishedAt));
    },
  );

  // Publish a new version
  app.post<{
    Params: { name: string };
    Body: {
      version: string;
      manifest: Record<string, unknown>;
      readme?: string;
      checksum?: string;
    };
  }>('/api/v1/packages/:name/versions', async (request, reply) => {
    const { name } = request.params;
    const { version, manifest, readme, checksum } = request.body;

    const [pkg] = await db.select().from(packages).where(eq(packages.name, name));
    if (!pkg) {
      reply.status(404).send({
        error: { code: 'PACKAGE_NOT_FOUND', message: `Package "${name}" not found` },
      });
      return;
    }

    const id = ulid();
    const now = new Date();

    const [ver] = await db.insert(packageVersions).values({
      id,
      packageId: pkg.id,
      version,
      manifest,
      readme: readme ?? '',
      checksum: checksum ?? null,
      publishedAt: now,
      yanked: false,
    }).returning();

    // Update the package's updatedAt timestamp
    await db
      .update(packages)
      .set({ updatedAt: now })
      .where(eq(packages.id, pkg.id));

    reply.status(201).send(ver);
  });

  // Get a specific version
  app.get<{ Params: { name: string; version: string } }>(
    '/api/v1/packages/:name/versions/:version',
    async (request, reply) => {
      const { name, version } = request.params;

      const [pkg] = await db.select().from(packages).where(eq(packages.name, name));
      if (!pkg) {
        reply.status(404).send({
          error: { code: 'PACKAGE_NOT_FOUND', message: `Package "${name}" not found` },
        });
        return;
      }

      const [ver] = await db
        .select()
        .from(packageVersions)
        .where(
          and(
            eq(packageVersions.packageId, pkg.id),
            eq(packageVersions.version, version),
          ),
        );

      if (!ver) {
        reply.status(404).send({
          error: {
            code: 'VERSION_NOT_FOUND',
            message: `Version "${version}" not found for package "${name}"`,
          },
        });
        return;
      }

      return ver;
    },
  );
}
