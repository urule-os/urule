import { describe, it, expect } from 'vitest';
import { TOPICS, REGISTRY_TOPICS, ORCHESTRATOR_TOPICS } from '../src/topics.js';

describe('TOPICS', () => {
  it('follows the urule.{domain}.{entity}.{action} convention', () => {
    const allTopics = [
      ...Object.values(REGISTRY_TOPICS),
      ...Object.values(ORCHESTRATOR_TOPICS),
    ];

    for (const topic of allTopics) {
      const parts = topic.split('.');
      expect(parts.length).toBe(4);
      expect(parts[0]).toBe('urule');
    }
  });

  it('groups topics by domain', () => {
    expect(TOPICS.registry).toBe(REGISTRY_TOPICS);
    expect(TOPICS.orchestrator).toBe(ORCHESTRATOR_TOPICS);
  });

  it('has correct registry topic values', () => {
    expect(REGISTRY_TOPICS.WORKSPACE_CREATED).toBe('urule.registry.workspace.created');
    expect(REGISTRY_TOPICS.AGENT_REGISTERED).toBe('urule.registry.agent.registered');
  });
});
