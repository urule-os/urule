import { describe, it, expect } from 'vitest';
import { createEvent } from '../src/envelope.js';

describe('createEvent', () => {
  it('creates an event with all required fields', () => {
    const event = createEvent('urule.registry.workspace.created', 'urule-registry', {
      workspaceId: '01HZQX5K8B3YNPWJ4G0RCMVT6E',
      orgId: '01HZQX5K8B3YNPWJ4G0RCMVT6F',
      name: 'My Workspace',
      slug: 'my-workspace',
    });

    expect(event.id).toMatch(/^[0-9A-Z]{26}$/);
    expect(event.type).toBe('urule.registry.workspace.created');
    expect(event.source).toBe('urule-registry');
    expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(event.version).toBe(1);
    expect(event.correlationId).toMatch(/^[0-9A-Z]{26}$/);
    expect(event.data.workspaceId).toBe('01HZQX5K8B3YNPWJ4G0RCMVT6E');
  });

  it('accepts custom correlationId', () => {
    const event = createEvent('urule.test', 'test', { foo: 'bar' }, {
      correlationId: 'custom-correlation-id',
    });

    expect(event.correlationId).toBe('custom-correlation-id');
  });

  it('accepts custom version', () => {
    const event = createEvent('urule.test', 'test', { foo: 'bar' }, {
      version: 2,
    });

    expect(event.version).toBe(2);
  });
});
