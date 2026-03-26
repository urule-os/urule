import { describe, it, expect, beforeEach } from 'vitest';
import { PresenceManager } from '../src/services/presence-manager.js';

describe('PresenceManager', () => {
  let manager: PresenceManager;

  beforeEach(() => {
    manager = new PresenceManager();
  });

  it('should join a room with default online status', () => {
    const presence = manager.join('user-1', 'room-1', 'ws-1');
    expect(presence.userId).toBe('user-1');
    expect(presence.roomId).toBe('room-1');
    expect(presence.workspaceId).toBe('ws-1');
    expect(presence.status).toBe('online');
    expect(presence.lastSeen).toBeDefined();
  });

  it('should leave a room', () => {
    manager.join('user-1', 'room-1', 'ws-1');
    const result = manager.leave('user-1', 'room-1');
    expect(result).toBe(true);
    const presences = manager.getPresence('room-1');
    expect(presences).toHaveLength(0);
  });

  it('should update user status', () => {
    manager.join('user-1', 'room-1', 'ws-1');
    const updated = manager.updateStatus('user-1', 'room-1', 'busy');
    expect(updated).toBeDefined();
    expect(updated!.status).toBe('busy');
  });

  it('should get all presences in a room', () => {
    manager.join('user-1', 'room-1', 'ws-1');
    manager.join('user-2', 'room-1', 'ws-1');
    manager.join('user-3', 'room-2', 'ws-1');
    const presences = manager.getPresence('room-1');
    expect(presences).toHaveLength(2);
    expect(presences.map((p) => p.userId).sort()).toEqual(['user-1', 'user-2']);
  });

  it('should get all presences for a user across rooms', () => {
    manager.join('user-1', 'room-1', 'ws-1');
    manager.join('user-1', 'room-2', 'ws-1');
    const presences = manager.getUserPresence('user-1');
    expect(presences).toHaveLength(2);
    expect(presences.map((p) => p.roomId).sort()).toEqual(['room-1', 'room-2']);
  });

  it('should update lastSeen on heartbeat', () => {
    manager.join('user-1', 'room-1', 'ws-1');
    const before = Date.now();
    const result = manager.heartbeat('user-1', 'room-1');
    expect(result).toBe(true);
    const updated = manager.getPresence('room-1')[0];
    expect(updated).toBeDefined();
    expect(new Date(updated!.lastSeen).getTime()).toBeGreaterThanOrEqual(before);
  });
});
