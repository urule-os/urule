import { ilike, eq, and, desc, type SQL } from 'drizzle-orm';
import type { Database } from '../db/connection.js';
import { packages } from '../db/schema/packages.js';

export interface PackageSearchResult {
  id: string;
  name: string;
  type: string;
  description: string;
  author: string;
  verified: boolean;
  downloads: number;
  tags: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchFilters {
  type?: string;
  verified?: boolean;
}

export class SearchService {
  constructor(private db: Database) {}

  async search(query: string, filters?: SearchFilters): Promise<PackageSearchResult[]> {
    const conditions: SQL[] = [];

    if (query) {
      conditions.push(ilike(packages.name, `%${query}%`));
    }

    if (filters?.type) {
      conditions.push(eq(packages.type, filters.type));
    }

    if (filters?.verified !== undefined) {
      conditions.push(eq(packages.verified, filters.verified));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await this.db
      .select()
      .from(packages)
      .where(where)
      .orderBy(desc(packages.downloads));

    return results;
  }

  async getPopular(limit: number = 10): Promise<PackageSearchResult[]> {
    return this.db
      .select()
      .from(packages)
      .orderBy(desc(packages.downloads))
      .limit(limit);
  }

  async getRecent(limit: number = 10): Promise<PackageSearchResult[]> {
    return this.db
      .select()
      .from(packages)
      .orderBy(desc(packages.createdAt))
      .limit(limit);
  }
}
