#!/usr/bin/env node

/**
 * Phase 1 End-to-End Integration Test
 *
 * Exercises the full Phase 1 flow:
 *   1. Create org (registry)
 *   2. Create workspace (registry)
 *   3. Register agent (registry)
 *   4. Register runtime (registry)
 *   5. Allocate runtime session (runtime-broker)
 *   6. Start orchestrator run (langgraph-adapter)
 *   7. Get run state
 *   8. Pause run for approval
 *   9. Resume run
 *  10. Emit artifact
 *  11. Cancel run
 *  12. Terminate session (runtime-broker)
 *
 * Usage: node e2e/phase1.test.mjs
 *
 * Expects services to be running:
 *   - registry       on http://localhost:3001
 *   - langgraph-adapter on http://localhost:3002
 *   - runtime-broker on http://localhost:4500
 */

const REGISTRY = process.env.REGISTRY_URL ?? 'http://localhost:3001';
const ADAPTER = process.env.ADAPTER_URL ?? 'http://localhost:3002';
const BROKER = process.env.BROKER_URL ?? 'http://localhost:4500';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function test(name, fn) {
  process.stdout.write(`  ${name} ... `);
  try {
    await fn();
    console.log('PASS');
    passed++;
  } catch (err) {
    console.log('FAIL');
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function post(base, path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function get(base, path) {
  const res = await fetch(`${base}${path}`);
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function del(base, path) {
  const res = await fetch(`${base}${path}`, { method: 'DELETE' });
  return { status: res.status, data: res.status === 204 ? null : await res.json().catch(() => null) };
}

// ---------------------------------------------------------------------------
// Wait for services to be ready
// ---------------------------------------------------------------------------

async function waitForService(name, url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${url}/healthz`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${name} not ready at ${url}/healthz after ${maxRetries * 2}s`);
}

// ---------------------------------------------------------------------------
// Run tests
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n=== Urule Phase 1 — End-to-End Integration Test ===\n');

  // Wait for all services
  console.log('Waiting for services...');
  await Promise.all([
    waitForService('registry', REGISTRY),
    waitForService('langgraph-adapter', ADAPTER),
    waitForService('runtime-broker', BROKER),
  ]);
  console.log('All services ready.\n');

  // State shared across tests
  let orgId, workspaceId, agentId, runtimeId, sessionId, runId;

  // --- Registry: Org ---

  await test('Health check — registry', async () => {
    const { status, data } = await get(REGISTRY, '/healthz');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'ok', `Expected ok, got ${data.status}`);
  });

  await test('Create org', async () => {
    const { status, data } = await post(REGISTRY, '/api/v1/orgs', {
      name: 'E2E Test Org',
      slug: 'e2e-test-org',
    });
    assert(status === 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
    assert(data.id, 'Missing org id');
    assert(data.name === 'E2E Test Org', `Unexpected name: ${data.name}`);
    orgId = data.id;
  });

  await test('Get org by ID', async () => {
    const { status, data } = await get(REGISTRY, `/api/v1/orgs/${orgId}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.id === orgId, 'Org ID mismatch');
  });

  // --- Registry: Workspace ---

  await test('Create workspace', async () => {
    const { status, data } = await post(REGISTRY, '/api/v1/workspaces', {
      orgId,
      name: 'E2E Workspace',
      slug: 'e2e-workspace',
      description: 'End-to-end test workspace',
    });
    assert(status === 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
    assert(data.id, 'Missing workspace id');
    workspaceId = data.id;
  });

  await test('List workspaces for org', async () => {
    const { status, data } = await get(REGISTRY, `/api/v1/orgs/${orgId}/workspaces`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(data), 'Expected array');
    assert(data.length === 1, `Expected 1 workspace, got ${data.length}`);
    assert(data[0].id === workspaceId, 'Workspace ID mismatch');
  });

  // --- Registry: Agent ---

  await test('Register agent', async () => {
    const { status, data } = await post(REGISTRY, '/api/v1/agents', {
      workspaceId,
      name: 'E2E Test Agent',
      description: 'An agent for integration testing',
      config: { model: 'gpt-4' },
    });
    assert(status === 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
    assert(data.id, 'Missing agent id');
    assert(data.status === 'idle', `Expected idle, got ${data.status}`);
    agentId = data.id;
  });

  await test('Get agent by ID', async () => {
    const { status, data } = await get(REGISTRY, `/api/v1/agents/${agentId}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.name === 'E2E Test Agent', `Unexpected name: ${data.name}`);
  });

  await test('List agents for workspace', async () => {
    const { status, data } = await get(REGISTRY, `/api/v1/workspaces/${workspaceId}/agents`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.length === 1, `Expected 1 agent, got ${data.length}`);
  });

  // --- Registry: Runtime ---

  await test('Register runtime', async () => {
    const { status, data } = await post(REGISTRY, '/api/v1/runtimes', {
      workspaceId,
      provider: 'sandboxed',
      profile: 'default',
      capabilities: { exec: true, network: false },
    });
    assert(status === 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
    assert(data.id, 'Missing runtime id');
    assert(data.status === 'available', `Expected available, got ${data.status}`);
    runtimeId = data.id;
  });

  await test('List runtimes for workspace', async () => {
    const { status, data } = await get(REGISTRY, `/api/v1/workspaces/${workspaceId}/runtimes`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.length === 1, `Expected 1 runtime, got ${data.length}`);
  });

  // --- Runtime Broker: Session ---

  await test('Health check — runtime-broker', async () => {
    const { status, data } = await get(BROKER, '/healthz');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'ok', `Expected ok, got ${data.status}`);
  });

  await test('List available runtime providers', async () => {
    const { status, data } = await get(BROKER, '/api/v1/runtimes');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.runtimes, 'Missing runtimes');
    assert(data.runtimes.length > 0, 'No runtime providers');
  });

  await test('Allocate session', async () => {
    const { status, data } = await post(BROKER, '/api/v1/sessions', {
      provider: 'mock',
      workspaceId,
      runtimeProfile: 'default',
    });
    assert(status === 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
    assert(data.sessionId, 'Missing sessionId');
    assert(data.status === 'running', `Expected running, got ${data.status}`);
    sessionId = data.sessionId;
  });

  await test('Get session status', async () => {
    const { status, data } = await get(BROKER, `/api/v1/sessions/${sessionId}/status`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'running', `Expected running, got ${data.status}`);
  });

  // --- LangGraph Adapter: Run lifecycle ---

  await test('Health check — langgraph-adapter', async () => {
    const { status, data } = await get(ADAPTER, '/healthz');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'ok', `Expected ok, got ${data.status}`);
  });

  await test('Get adapter capabilities', async () => {
    const { status, data } = await get(ADAPTER, '/api/v1/capabilities');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.humanInTheLoop === true, 'Expected humanInTheLoop');
    assert(data.cancellation === true, 'Expected cancellation');
  });

  await test('Start run', async () => {
    const { status, data } = await post(ADAPTER, '/api/v1/runs', {
      graphId: 'e2e-test-graph',
      input: { message: 'Hello from E2E test', agentId, workspaceId },
      metadata: { sessionId, runtimeId },
    });
    assert(status === 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
    assert(data.runId, 'Missing runId');
    assert(data.status === 'running', `Expected running, got ${data.status}`);
    runId = data.runId;
  });

  await test('Get run state', async () => {
    const { status, data } = await get(ADAPTER, `/api/v1/runs/${runId}/state`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'running', `Expected running, got ${data.status}`);
    assert(data.artifacts.length === 0, 'Expected no artifacts yet');
  });

  await test('Pause run for approval', async () => {
    const { status } = await post(ADAPTER, `/api/v1/runs/${runId}/pause`, {});
    assert(status === 204, `Expected 204, got ${status}`);
  });

  await test('Verify run is paused', async () => {
    const { status, data } = await get(ADAPTER, `/api/v1/runs/${runId}/state`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'paused', `Expected paused, got ${data.status}`);
  });

  await test('Resume run', async () => {
    const { status } = await post(ADAPTER, `/api/v1/runs/${runId}/resume`, {});
    assert(status === 204, `Expected 204, got ${status}`);
  });

  await test('Verify run is running again', async () => {
    const { status, data } = await get(ADAPTER, `/api/v1/runs/${runId}/state`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'running', `Expected running, got ${data.status}`);
  });

  await test('Emit artifact', async () => {
    const { status } = await post(ADAPTER, `/api/v1/runs/${runId}/artifacts`, {
      artifactId: 'artifact-001',
      type: 'report',
      uri: 'file:///tmp/e2e-report.md',
    });
    assert(status === 201, `Expected 201, got ${status}`);
  });

  await test('Verify artifact attached', async () => {
    const { status, data } = await get(ADAPTER, `/api/v1/runs/${runId}/state`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.artifacts.length === 1, `Expected 1 artifact, got ${data.artifacts.length}`);
    assert(data.artifacts[0].artifactId === 'artifact-001', 'Artifact ID mismatch');
  });

  await test('Cancel run', async () => {
    const { status } = await del(ADAPTER, `/api/v1/runs/${runId}`);
    assert(status === 204, `Expected 204, got ${status}`);
  });

  await test('Verify run is cancelled', async () => {
    const { status, data } = await get(ADAPTER, `/api/v1/runs/${runId}/state`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'cancelled', `Expected cancelled, got ${data.status}`);
  });

  // --- Cleanup: terminate session ---

  await test('Terminate session', async () => {
    const { status } = await del(BROKER, `/api/v1/sessions/${sessionId}`);
    assert(status === 204, `Expected 204, got ${status}`);
  });

  await test('Verify session is terminated', async () => {
    const { status } = await get(BROKER, `/api/v1/sessions/${sessionId}/status`);
    assert(status === 404, `Expected 404, got ${status}`);
  });

  // --- Summary ---

  console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${passed + failed} total ===\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
