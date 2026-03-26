import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../src/services/room-manager.js';

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = new RoomManager();
  });

  it('should create a room with a generated id', () => {
    const room = manager.createRoom({
      workspaceId: 'ws-1',
      name: 'Main Office',
      type: 'office',
    });
    expect(room.id).toBeDefined();
    expect(room.name).toBe('Main Office');
    expect(room.type).toBe('office');
    expect(room.workspaceId).toBe('ws-1');
    expect(room.createdAt).toBeDefined();
  });

  it('should get a room by id', () => {
    const created = manager.createRoom({
      workspaceId: 'ws-1',
      name: 'Meeting Room',
      type: 'meeting',
    });
    const found = manager.getRoom(created.id);
    expect(found).toEqual(created);
  });

  it('should list rooms by workspaceId', () => {
    manager.createRoom({ workspaceId: 'ws-1', name: 'Room A', type: 'office' });
    manager.createRoom({ workspaceId: 'ws-1', name: 'Room B', type: 'public' });
    manager.createRoom({ workspaceId: 'ws-2', name: 'Room C', type: 'private' });

    const rooms = manager.listRooms('ws-1');
    expect(rooms).toHaveLength(2);
    expect(rooms.map((r) => r.name).sort()).toEqual(['Room A', 'Room B']);
  });

  it('should update a room', () => {
    const created = manager.createRoom({
      workspaceId: 'ws-1',
      name: 'Old Name',
      type: 'office',
    });
    const updated = manager.updateRoom(created.id, { name: 'New Name', capacity: 10 });
    expect(updated).toBeDefined();
    expect(updated!.name).toBe('New Name');
    expect(updated!.capacity).toBe(10);
    expect(updated!.type).toBe('office');
  });

  it('should delete a room', () => {
    const created = manager.createRoom({
      workspaceId: 'ws-1',
      name: 'Temp Room',
      type: 'meeting',
    });
    const deleted = manager.deleteRoom(created.id);
    expect(deleted).toBe(true);
    expect(manager.getRoom(created.id)).toBeUndefined();

    const deletedAgain = manager.deleteRoom(created.id);
    expect(deletedAgain).toBe(false);
  });
});
