import { ulid } from 'ulid';
import type { Room } from '../types.js';

export class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(params: {
    workspaceId: string;
    name: string;
    type: Room['type'];
    description?: string;
    capacity?: number;
  }): Room {
    const room: Room = {
      id: ulid(),
      workspaceId: params.workspaceId,
      name: params.name,
      type: params.type,
      description: params.description,
      capacity: params.capacity,
      createdAt: new Date().toISOString(),
    };
    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  listRooms(workspaceId: string): Room[] {
    const results: Room[] = [];
    for (const room of this.rooms.values()) {
      if (room.workspaceId === workspaceId) {
        results.push(room);
      }
    }
    return results;
  }

  updateRoom(id: string, updates: Partial<Pick<Room, 'name' | 'type' | 'description' | 'capacity'>>): Room | undefined {
    const existing = this.rooms.get(id);
    if (!existing) return undefined;
    const updated: Room = { ...existing, ...updates };
    this.rooms.set(id, updated);
    return updated;
  }

  deleteRoom(id: string): boolean {
    return this.rooms.delete(id);
  }
}
