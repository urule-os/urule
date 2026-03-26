import type { WidgetState } from '../types.js';

export class WidgetStateManager {
  private states = new Map<string, WidgetState>();

  setState(instanceId: string, workspaceId: string, state: Record<string, unknown>): WidgetState {
    const widgetState: WidgetState = {
      instanceId,
      workspaceId,
      state,
      updatedAt: new Date().toISOString(),
    };
    this.states.set(instanceId, widgetState);
    return widgetState;
  }

  getState(instanceId: string): WidgetState | undefined {
    return this.states.get(instanceId);
  }

  patchState(instanceId: string, patch: Record<string, unknown>): WidgetState | undefined {
    const existing = this.states.get(instanceId);
    if (!existing) return undefined;
    const updated: WidgetState = {
      ...existing,
      state: { ...existing.state, ...patch },
      updatedAt: new Date().toISOString(),
    };
    this.states.set(instanceId, updated);
    return updated;
  }

  deleteState(instanceId: string): boolean {
    return this.states.delete(instanceId);
  }
}
