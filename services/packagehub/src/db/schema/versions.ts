import { pgTable, varchar, text, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';
import { packages } from './packages.js';

export const packageVersions = pgTable('package_versions', {
  id: varchar('id', { length: 26 }).primaryKey(),
  packageId: varchar('package_id', { length: 26 }).notNull().references(() => packages.id),
  version: varchar('version', { length: 50 }).notNull(),
  manifest: jsonb('manifest').notNull(), // full package manifest
  readme: text('readme').notNull().default(''),
  checksum: varchar('checksum', { length: 128 }),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  yanked: boolean('yanked').notNull().default(false),
});
