import { buildServer } from './server.js';
import { loadConfig, validateConfig } from './config.js';

const config = loadConfig();
validateConfig(config);
const app = await buildServer();
await app.listen({ port: config.port, host: config.host });
console.log(`urule-state listening on ${config.host}:${config.port}`);
