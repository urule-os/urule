import { describe, it, expect, beforeEach } from 'vitest';
import { TaskManager } from '../src/services/task-manager.js';

describe('TaskManager', () => {
  let manager: TaskManager;

  beforeEach(() => {
    manager = new TaskManager();
  });

  it('should create a task with defaults', () => {
    const task = manager.createTask({
      workspaceId: 'ws-1',
      title: 'Fix bug',
      creatorId: 'user-1',
    });
    expect(task.id).toBeDefined();
    expect(task.title).toBe('Fix bug');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.labels).toEqual([]);
    expect(task.creatorId).toBe('user-1');
  });

  it('should list tasks filtered by workspaceId', () => {
    manager.createTask({ workspaceId: 'ws-1', title: 'T1', creatorId: 'user-1' });
    manager.createTask({ workspaceId: 'ws-1', title: 'T2', creatorId: 'user-1' });
    manager.createTask({ workspaceId: 'ws-2', title: 'T3', creatorId: 'user-3' });

    expect(manager.listTasks({ workspaceId: 'ws-1' })).toHaveLength(2);
    expect(manager.listTasks({ workspaceId: 'ws-2' })).toHaveLength(1);
  });

  it('should list tasks filtered by status', () => {
    manager.createTask({ workspaceId: 'ws-1', title: 'T1', creatorId: 'user-1' });
    manager.createTask({ workspaceId: 'ws-1', title: 'T2', creatorId: 'user-1', status: 'in_progress' });

    expect(manager.listTasks({ status: 'todo' })).toHaveLength(1);
    expect(manager.listTasks({ status: 'in_progress' })).toHaveLength(1);
    expect(manager.listTasks()).toHaveLength(2);
  });

  it('should assign a task and record ownership transfer', () => {
    const task = manager.createTask({
      workspaceId: 'ws-1',
      title: 'Assignable',
      creatorId: 'user-1',
      assigneeId: 'user-1',
    });
    const transfer = manager.assignTask(task.id, 'user-2', 'Handing off');
    expect(transfer).toBeDefined();
    expect(transfer!.fromUserId).toBe('user-1');
    expect(transfer!.toUserId).toBe('user-2');
    expect(transfer!.reason).toBe('Handing off');

    const updated = manager.getTask(task.id);
    expect(updated?.assigneeId).toBe('user-2');
  });

  it('should track ownership transfer history', () => {
    const task = manager.createTask({
      workspaceId: 'ws-1',
      title: 'Multi-assign',
      creatorId: 'user-1',
      assigneeId: 'user-1',
    });
    manager.assignTask(task.id, 'user-2');
    manager.assignTask(task.id, 'user-3', 'Reassigning');

    const history = manager.getOwnershipHistory(task.id);
    expect(history).toHaveLength(2);
    expect(history[0]!.fromUserId).toBe('user-1');
    expect(history[0]!.toUserId).toBe('user-2');
    expect(history[1]!.fromUserId).toBe('user-2');
    expect(history[1]!.toUserId).toBe('user-3');
    expect(history[1]!.reason).toBe('Reassigning');
  });
});
