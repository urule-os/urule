import type { Presence } from '../types.js';

export class PresenceManager {
  private presences = new Map<string, Presence>();

  private key(userId: string, roomId: string): string {
    return `${userId}:${roomId}`;
  }

  join(
    userId: string,
    roomId: string,
    workspaceId: string,
    status: Presence['status'] = 'online',
  ): Presence {
    const presence: Presence = {
      userId,
      roomId,
      workspaceId,
      status,
      lastSeen: new Date().toISOString(),
    };
    this.presences.set(this.key(userId, roomId), presence);
    return presence;
  }

  leave(userId: string, roomId: string): boolean {
    return this.presences.delete(this.key(userId, roomId));
  }

  updateStatus(userId: string, roomId: string, status: Presence['status']): Presence | undefined {
    const k = this.key(userId, roomId);
    const existing = this.presences.get(k);
    if (!existing) return undefined;
    const updated: Presence = {
      ...existing,
      status,
      lastSeen: new Date().toISOString(),
    };
    this.presences.set(k, updated);
    return updated;
  }

  getPresence(roomId: string): Presence[] {
    const results: Presence[] = [];
    for (const p of this.presences.values()) {
      if (p.roomId === roomId) {
        results.push(p);
      }
    }
    return results;
  }

  getUserPresence(userId: string): Presence[] {
    const results: Presence[] = [];
    for (const p of this.presences.values()) {
      if (p.userId === userId) {
        results.push(p);
      }
    }
    return results;
  }

  heartbeat(userId: string, roomId: string): boolean {
    const k = this.key(userId, roomId);
    const existing = this.presences.get(k);
    if (!existing) return false;
    this.presences.set(k, {
      ...existing,
      lastSeen: new Date().toISOString(),
    });
    return true;
  }
}
