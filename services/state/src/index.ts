import { buildServer } from './server.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = await buildServer();
await app.listen({ port: config.port, host: config.host });
console.log(`urule-state listening on ${config.host}:${config.port}`);
