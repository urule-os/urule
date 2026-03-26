import { describe, it, expect, beforeEach } from 'vitest';
import { WidgetStateManager } from '../src/services/widget-state-manager.js';

describe('WidgetStateManager', () => {
  let manager: WidgetStateManager;

  beforeEach(() => {
    manager = new WidgetStateManager();
  });

  it('should set widget state', () => {
    const state = manager.setState('widget-1', 'ws-1', { count: 0, label: 'test' });
    expect(state.instanceId).toBe('widget-1');
    expect(state.workspaceId).toBe('ws-1');
    expect(state.state).toEqual({ count: 0, label: 'test' });
    expect(state.updatedAt).toBeDefined();
  });

  it('should get widget state', () => {
    manager.setState('widget-1', 'ws-1', { count: 5 });
    const state = manager.getState('widget-1');
    expect(state).toBeDefined();
    expect(state!.state).toEqual({ count: 5 });

    expect(manager.getState('nonexistent')).toBeUndefined();
  });

  it('should patch widget state by merging', () => {
    manager.setState('widget-1', 'ws-1', { count: 0, label: 'original' });
    const patched = manager.patchState('widget-1', { count: 10, extra: true });
    expect(patched).toBeDefined();
    expect(patched!.state).toEqual({ count: 10, label: 'original', extra: true });
  });

  it('should delete widget state', () => {
    manager.setState('widget-1', 'ws-1', { count: 0 });
    const deleted = manager.deleteState('widget-1');
    expect(deleted).toBe(true);
    expect(manager.getState('widget-1')).toBeUndefined();

    const deletedAgain = manager.deleteState('widget-1');
    expect(deletedAgain).toBe(false);
  });
});
