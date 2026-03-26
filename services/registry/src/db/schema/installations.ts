import { pgTable, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';

export const installations = pgTable('installations', {
  id: varchar('id', { length: 26 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 26 }).notNull().references(() => workspaces.id),
  packageId: varchar('package_id', { length: 26 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  installedAt: timestamp('installed_at', { withTimezone: true }),
  config: jsonb('config').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
