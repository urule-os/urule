import { ulid } from 'ulid';
import type { Task, OwnershipTransfer } from '../types.js';

export class TaskManager {
  private tasks = new Map<string, Task>();
  private transfers = new Map<string, OwnershipTransfer[]>();

  createTask(params: {
    workspaceId: string;
    title: string;
    description?: string;
    status?: Task['status'];
    priority?: Task['priority'];
    assigneeId?: string;
    creatorId: string;
    labels?: string[];
    roomId?: string;
    dueDate?: string;
  }): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: ulid(),
      workspaceId: params.workspaceId,
      roomId: params.roomId,
      title: params.title,
      description: params.description,
      status: params.status ?? 'todo',
      priority: params.priority ?? 'medium',
      assigneeId: params.assigneeId,
      creatorId: params.creatorId,
      labels: params.labels ?? [],
      dueDate: params.dueDate,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  listTasks(filter?: {
    workspaceId?: string;
    assigneeId?: string;
    status?: Task['status'];
    roomId?: string;
  }): Task[] {
    const results: Task[] = [];
    for (const task of this.tasks.values()) {
      if (filter) {
        if (filter.workspaceId && task.workspaceId !== filter.workspaceId) continue;
        if (filter.assigneeId && task.assigneeId !== filter.assigneeId) continue;
        if (filter.status && task.status !== filter.status) continue;
        if (filter.roomId && task.roomId !== filter.roomId) continue;
      }
      results.push(task);
    }
    return results;
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | undefined {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated: Task = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  assignTask(taskId: string, assigneeId: string, reason?: string): OwnershipTransfer | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    const transfer: OwnershipTransfer = {
      taskId,
      fromUserId: task.assigneeId ?? task.creatorId,
      toUserId: assigneeId,
      reason,
      timestamp: new Date().toISOString(),
    };

    task.assigneeId = assigneeId;
    task.updatedAt = new Date().toISOString();
    this.tasks.set(taskId, task);

    const history = this.transfers.get(taskId) ?? [];
    history.push(transfer);
    this.transfers.set(taskId, history);

    return transfer;
  }

  getOwnershipHistory(taskId: string): OwnershipTransfer[] {
    return this.transfers.get(taskId) ?? [];
  }

  deleteTask(id: string): boolean {
    this.transfers.delete(id);
    return this.tasks.delete(id);
  }
}
