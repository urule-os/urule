import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { orgs } from './schema/orgs.js';
import { workspaces } from './schema/workspaces.js';
import { rooms } from './schema/rooms.js';
import { agents } from './schema/agents.js';
import { runtimes } from './schema/runtimes.js';
import { installations } from './schema/installations.js';
import { providers } from './schema/providers.js';
import { conversations, conversationAgents, messages } from './schema/conversations.js';

export const schema = { orgs, workspaces, rooms, agents, runtimes, installations, providers, conversations, conversationAgents, messages };

export function createDb(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
