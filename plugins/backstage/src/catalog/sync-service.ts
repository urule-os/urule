import type { BackstageCatalogEntity, UruleOrg, UruleWorkspace, UruleAgent } from './entity-mapper.js';
import { mapOrgToGroup, mapWorkspaceToSystem, mapAgentToComponent } from './entity-mapper.js';

export interface SyncResult {
  synced: number;
  errors: string[];
  entities: BackstageCatalogEntity[];
}

export interface RegistryClient {
  fetchOrgs(): Promise<UruleOrg[]>;
  fetchWorkspaces(orgId: string): Promise<UruleWorkspace[]>;
  fetchAgents(workspaceId: string): Promise<UruleAgent[]>;
}

export class CatalogSyncService {
  private lastSyncAt: string | null = null;

  constructor(private registryClient: RegistryClient) {}

  async sync(): Promise<SyncResult> {
    const entities: BackstageCatalogEntity[] = [];
    const errors: string[] = [];

    try {
      const orgs = await this.registryClient.fetchOrgs();

      for (const org of orgs) {
        entities.push(mapOrgToGroup(org));

        try {
          const workspaces = await this.registryClient.fetchWorkspaces(org.id);

          for (const ws of workspaces) {
            entities.push(mapWorkspaceToSystem(ws, org.slug));

            try {
              const agents = await this.registryClient.fetchAgents(ws.id);
              for (const agent of agents) {
                entities.push(mapAgentToComponent(agent, `${org.slug}-${ws.slug}`));
              }
            } catch (err) {
              errors.push(`Failed to fetch agents for workspace ${ws.id}: ${(err as Error).message}`);
            }
          }
        } catch (err) {
          errors.push(`Failed to fetch workspaces for org ${org.id}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      errors.push(`Failed to fetch orgs: ${(err as Error).message}`);
    }

    this.lastSyncAt = new Date().toISOString();

    return {
      synced: entities.length,
      errors,
      entities,
    };
  }

  getLastSyncAt(): string | null {
    return this.lastSyncAt;
  }
}
