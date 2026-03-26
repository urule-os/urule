export interface Config {
  port: number;
  host: string;
  natsUrl: string;
}

export function loadConfig(): Config {
  return {
    port: Number(process.env.PORT ?? 3007),
    host: process.env.HOST ?? '0.0.0.0',
    natsUrl: process.env.NATS_URL ?? 'nats://localhost:4222',
  };
}

export function validateConfig(config: Config): void {
  const missing: string[] = [];
  if (!process.env.NATS_URL && config.natsUrl.includes('localhost')) {
    missing.push('NATS_URL (using default)');
  }
  if (missing.length > 0) {
    console.warn(`[urule-state] Config warnings: ${missing.join(', ')}`);
  }
}
