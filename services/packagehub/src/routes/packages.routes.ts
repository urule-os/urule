import type { FastifyInstance } from 'fastify';
import { ulid } from 'ulid';
import { eq, desc } from 'drizzle-orm';
import type { Database } from '../db/connection.js';
import { packages } from '../db/schema/packages.js';
import { packageVersions } from '../db/schema/versions.js';
import { SearchService } from '../services/search.js';

/** Attach the latest non-yanked version to each package row. */
async function attachLatestVersions(db: Database, pkgs: Record<string, unknown>[]) {
  if (pkgs.length === 0) return pkgs;
  const pkgIds = pkgs.map(p => p.id as string);
  const versions = await db
    .select()
    .from(packageVersions)
    .where(eq(packageVersions.yanked, false))
    .orderBy(desc(packageVersions.publishedAt));

  const latestByPkg = new Map<string, Record<string, unknown>>();
  for (const v of versions) {
    if (pkgIds.includes(v.packageId) && !latestByPkg.has(v.packageId)) {
      latestByPkg.set(v.packageId, v as Record<string, unknown>);
    }
  }
  return pkgs.map(p => ({
    ...p,
    latest_version: latestByPkg.get(p.id as string) ?? null,
  }));
}

export function registerPackageRoutes(app: FastifyInstance, db: Database) {
  const searchService = new SearchService(db);

  // List / search packages (with latest version manifest attached)
  app.get<{
    Querystring: {
      q?: string;
      type?: string;
      verified?: string;
      sort?: string;
      limit?: string;
      offset?: string;
    };
  }>('/api/v1/packages', async (request) => {
    const { q, type, verified, sort, limit } = request.query;

    let results;
    if (sort === 'popular') {
      results = await searchService.getPopular(limit ? parseInt(limit, 10) : undefined);
    } else if (sort === 'recent') {
      results = await searchService.getRecent(limit ? parseInt(limit, 10) : undefined);
    } else {
      results = await searchService.search(q ?? '', {
        type,
        verified: verified !== undefined ? verified === 'true' : undefined,
      });
    }
    return attachLatestVersions(db, results as unknown as Record<string, unknown>[]);
  });

  // Register / publish a package
  app.post<{
    Body: {
      name: string;
      type: string;
      description?: string;
      author: string;
      repository?: string;
      homepage?: string;
      license?: string;
      tags?: string[];
    };
  }>('/api/v1/packages', async (request, reply) => {
    const { name, type, description, author, repository, homepage, license, tags } = request.body;
    const id = ulid();
    const now = new Date();

    const [pkg] = await db.insert(packages).values({
      id,
      name,
      type,
      description: description ?? '',
      author,
      repository: repository ?? null,
      homepage: homepage ?? null,
      license: license ?? null,
      verified: false,
      downloads: 0,
      tags: tags ?? [],
      createdAt: now,
      updatedAt: now,
    }).returning();

    reply.status(201).send(pkg);
  });

  // Get package by name
  app.get<{ Params: { name: string } }>('/api/v1/packages/:name', async (request, reply) => {
    const { name } = request.params;
    const [pkg] = await db.select().from(packages).where(eq(packages.name, name));

    if (!pkg) {
      reply.status(404).send({
        error: { code: 'PACKAGE_NOT_FOUND', message: `Package "${name}" not found` },
      });
      return;
    }

    return pkg;
  });
}
