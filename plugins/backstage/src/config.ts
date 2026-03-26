export interface Config {
  port: number;
  host: string;
  registryUrl: string;
  backstageUrl: string;
  syncIntervalMs: number;
  serviceName: string;
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    host: process.env['HOST'] ?? '0.0.0.0',
    registryUrl: process.env['REGISTRY_URL'] ?? 'http://localhost:3001',
    backstageUrl: process.env['BACKSTAGE_URL'] ?? 'http://localhost:7007',
    syncIntervalMs: parseInt(process.env['SYNC_INTERVAL_MS'] ?? '30000', 10),
    serviceName: 'backstage-urule-plugin',
  };
}
