import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService } from '../src/services/search.js';
import type { Database } from '../src/db/connection.js';

// Helper to build a mock package row
function makePackage(overrides: Partial<{
  id: string;
  name: string;
  type: string;
  description: string;
  author: string;
  repository: string | null;
  homepage: string | null;
  license: string | null;
  verified: boolean;
  downloads: number;
  tags: unknown;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? '01H0000000000000000000000',
    name: overrides.name ?? 'test-package',
    type: overrides.type ?? 'skill',
    description: overrides.description ?? 'A test package',
    author: overrides.author ?? 'tester',
    repository: overrides.repository ?? null,
    homepage: overrides.homepage ?? null,
    license: overrides.license ?? 'MIT',
    verified: overrides.verified ?? false,
    downloads: overrides.downloads ?? 0,
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? new Date('2025-01-01'),
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
  };
}

// Create a chainable query builder mock
function createQueryChain(results: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain['from'] = vi.fn().mockReturnValue(chain);
  chain['where'] = vi.fn().mockReturnValue(chain);
  chain['orderBy'] = vi.fn().mockReturnValue(chain);
  chain['limit'] = vi.fn().mockResolvedValue(results);
  // When no limit is called, the chain itself should resolve
  // We make orderBy resolve to results when it's the terminal call
  (chain['orderBy'] as ReturnType<typeof vi.fn>).mockReturnValue({
    ...chain,
    limit: vi.fn().mockResolvedValue(results),
    then: (resolve: (v: unknown) => void) => resolve(results),
  });
  (chain['where'] as ReturnType<typeof vi.fn>).mockReturnValue({
    ...chain,
    orderBy: vi.fn().mockReturnValue({
      ...chain,
      limit: vi.fn().mockResolvedValue(results),
      then: (resolve: (v: unknown) => void) => resolve(results),
    }),
    then: (resolve: (v: unknown) => void) => resolve(results),
  });
  (chain['from'] as ReturnType<typeof vi.fn>).mockReturnValue({
    ...chain,
    where: (chain['where'] as ReturnType<typeof vi.fn>),
    orderBy: vi.fn().mockReturnValue({
      ...chain,
      limit: vi.fn().mockResolvedValue(results),
      then: (resolve: (v: unknown) => void) => resolve(results),
    }),
    then: (resolve: (v: unknown) => void) => resolve(results),
  });

  return chain;
}

function createMockDb(results: unknown[] = []): Database {
  const chain = createQueryChain(results);
  return {
    select: vi.fn().mockReturnValue(chain),
  } as unknown as Database;
}

describe('SearchService', () => {
  let searchService: SearchService;
  let mockDb: Database;

  const samplePackages = [
    makePackage({ id: '01A', name: 'alpha-tool', type: 'skill', verified: true, downloads: 100, createdAt: new Date('2025-06-01') }),
    makePackage({ id: '01B', name: 'beta-personality', type: 'personality', verified: false, downloads: 50, createdAt: new Date('2025-07-01') }),
    makePackage({ id: '01C', name: 'gamma-connector', type: 'mcp_connector', verified: true, downloads: 200, createdAt: new Date('2025-08-01') }),
  ];

  beforeEach(() => {
    mockDb = createMockDb(samplePackages);
    searchService = new SearchService(mockDb);
  });

  describe('search', () => {
    it('should call db.select and return results', async () => {
      const results = await searchService.search('alpha');
      expect(results).toEqual(samplePackages);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should call db.select with empty query', async () => {
      const results = await searchService.search('');
      expect(results).toEqual(samplePackages);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should pass type filter through', async () => {
      const results = await searchService.search('', { type: 'skill' });
      expect(results).toEqual(samplePackages);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should pass verified filter through', async () => {
      const results = await searchService.search('', { verified: true });
      expect(results).toEqual(samplePackages);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should handle combined query and filters', async () => {
      const results = await searchService.search('alpha', { type: 'skill', verified: true });
      expect(results).toEqual(samplePackages);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('getPopular', () => {
    it('should query with default limit', async () => {
      const results = await searchService.getPopular();
      expect(results).toEqual(samplePackages);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should query with custom limit', async () => {
      const results = await searchService.getPopular(5);
      expect(results).toEqual(samplePackages);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('getRecent', () => {
    it('should query with default limit', async () => {
      const results = await searchService.getRecent();
      expect(results).toEqual(samplePackages);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should query with custom limit', async () => {
      const results = await searchService.getRecent(3);
      expect(results).toEqual(samplePackages);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});
