export interface Config {
  port: number;
  host: string;
  databaseUrl: string;
  natsUrl: string;
  serviceName: string;
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    host: process.env['HOST'] ?? '0.0.0.0',
    databaseUrl: process.env['DATABASE_URL'] ?? 'postgres://urule:urule@localhost:5432/packagehub',
    natsUrl: process.env['NATS_URL'] ?? 'localhost:4222',
    serviceName: 'urule-packagehub',
  };
}
