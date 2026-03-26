export interface Config {
  port: number;
  host: string;
  natsUrl: string;
  registryUrl: string;
  packagehubUrl: string;
  workDir: string;
  serviceName: string;
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    host: process.env['HOST'] ?? '0.0.0.0',
    natsUrl: process.env['NATS_URL'] ?? 'localhost:4222',
    registryUrl: process.env['REGISTRY_URL'] ?? 'http://localhost:3001',
    packagehubUrl: process.env['PACKAGEHUB_URL'] ?? 'http://localhost:3002',
    workDir: process.env['WORK_DIR'] ?? '/tmp/urule-packages',
    serviceName: 'urule-packages',
  };
}
