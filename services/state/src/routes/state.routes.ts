import type { FastifyInstance } from 'fastify';
import type { RoomManager } from '../services/room-manager.js';
import type { PresenceManager } from '../services/presence-manager.js';
import type { TaskManager } from '../services/task-manager.js';
import type { WidgetStateManager } from '../services/widget-state-manager.js';

export interface StateRouteServices {
  roomManager: RoomManager;
  presenceManager: PresenceManager;
  taskManager: TaskManager;
  widgetStateManager: WidgetStateManager;
}

export function registerStateRoutes(app: FastifyInstance, services: StateRouteServices): void {
  const { roomManager, presenceManager, taskManager, widgetStateManager } = services;

  // -- Rooms ---------------------------------------------------------

  app.post('/api/v1/rooms', async (req, reply) => {
    const body = req.body as {
      workspaceId: string;
      name: string;
      type: 'office' | 'meeting' | 'private' | 'public';
      description?: string;
      capacity?: number;
    };
    if (!body.workspaceId || !body.name || !body.type) {
      return reply.status(400).send({ error: 'Missing required fields: workspaceId, name, type' });
    }
    const room = roomManager.createRoom(body);
    return reply.status(201).send(room);
  });

  app.get('/api/v1/rooms', async (req, reply) => {
    const { workspaceId } = req.query as { workspaceId?: string };
    if (!workspaceId) {
      return reply.status(400).send({ error: 'Missing required query: workspaceId' });
    }
    const rooms = roomManager.listRooms(workspaceId);
    return reply.send(rooms);
  });

  app.get('/api/v1/rooms/:roomId', async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }
    return reply.send(room);
  });

  app.patch('/api/v1/rooms/:roomId', async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const updates = req.body as Record<string, unknown>;
    const room = roomManager.updateRoom(roomId, updates);
    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }
    return reply.send(room);
  });

  app.delete('/api/v1/rooms/:roomId', async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const deleted = roomManager.deleteRoom(roomId);
    if (!deleted) {
      return reply.status(404).send({ error: 'Room not found' });
    }
    return reply.status(204).send();
  });

  // -- Presence ------------------------------------------------------

  app.post('/api/v1/rooms/:roomId/presence', async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const { userId, status, workspaceId } = req.body as {
      userId: string;
      status?: 'online' | 'away' | 'busy' | 'offline';
      workspaceId: string;
    };
    if (!userId || !workspaceId) {
      return reply.status(400).send({ error: 'Missing required fields: userId, workspaceId' });
    }
    const presence = presenceManager.join(userId, roomId, workspaceId, status);
    return reply.status(201).send(presence);
  });

  app.get('/api/v1/rooms/:roomId/presence', async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const presences = presenceManager.getPresence(roomId);
    return reply.send(presences);
  });

  app.delete('/api/v1/rooms/:roomId/presence/:userId', async (req, reply) => {
    const { roomId, userId } = req.params as { roomId: string; userId: string };
    presenceManager.leave(userId, roomId);
    return reply.status(204).send();
  });

  app.patch('/api/v1/rooms/:roomId/presence/:userId', async (req, reply) => {
    const { roomId, userId } = req.params as { roomId: string; userId: string };
    const { status } = req.body as { status: 'online' | 'away' | 'busy' | 'offline' };
    if (!status) {
      return reply.status(400).send({ error: 'Missing required field: status' });
    }
    const presence = presenceManager.updateStatus(userId, roomId, status);
    if (!presence) {
      return reply.status(404).send({ error: 'Presence not found' });
    }
    return reply.send(presence);
  });

  // -- Tasks ---------------------------------------------------------

  app.post('/api/v1/tasks', async (req, reply) => {
    const body = req.body as {
      workspaceId: string;
      roomId?: string;
      title: string;
      description?: string;
      status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      assigneeId?: string;
      creatorId: string;
      labels?: string[];
      dueDate?: string;
    };
    if (!body.workspaceId || !body.title || !body.creatorId) {
      return reply.status(400).send({ error: 'Missing required fields: workspaceId, title, creatorId' });
    }
    const task = taskManager.createTask(body);
    return reply.status(201).send(task);
  });

  app.get('/api/v1/tasks', async (req, reply) => {
    const query = req.query as {
      workspaceId?: string;
      assigneeId?: string;
      status?: string;
      roomId?: string;
    };
    const tasks = taskManager.listTasks(
      Object.keys(query).length > 0 ? query as Parameters<typeof taskManager.listTasks>[0] : undefined,
    );
    return reply.send(tasks);
  });

  app.get('/api/v1/tasks/:taskId', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const task = taskManager.getTask(taskId);
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    return reply.send(task);
  });

  app.patch('/api/v1/tasks/:taskId', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const updates = req.body as Record<string, unknown>;
    const task = taskManager.updateTask(taskId, updates);
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    return reply.send(task);
  });

  app.delete('/api/v1/tasks/:taskId', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const deleted = taskManager.deleteTask(taskId);
    if (!deleted) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    return reply.status(204).send();
  });

  app.post('/api/v1/tasks/:taskId/assign', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const { assigneeId, reason } = req.body as { assigneeId: string; reason?: string };
    if (!assigneeId) {
      return reply.status(400).send({ error: 'Missing required field: assigneeId' });
    }
    const transfer = taskManager.assignTask(taskId, assigneeId, reason);
    if (!transfer) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    return reply.send(transfer);
  });

  app.get('/api/v1/tasks/:taskId/owners', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const task = taskManager.getTask(taskId);
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    const history = taskManager.getOwnershipHistory(taskId);
    return reply.send(history);
  });

  // -- Widget State --------------------------------------------------

  app.get('/api/v1/widget-state/:instanceId', async (req, reply) => {
    const { instanceId } = req.params as { instanceId: string };
    const state = widgetStateManager.getState(instanceId);
    if (!state) {
      return reply.status(404).send({ error: 'Widget state not found' });
    }
    return reply.send(state);
  });

  app.put('/api/v1/widget-state/:instanceId', async (req, reply) => {
    const { instanceId } = req.params as { instanceId: string };
    const { workspaceId, state } = req.body as { workspaceId: string; state: Record<string, unknown> };
    if (!workspaceId || !state) {
      return reply.status(400).send({ error: 'Missing required fields: workspaceId, state' });
    }
    const widgetState = widgetStateManager.setState(instanceId, workspaceId, state);
    return reply.send(widgetState);
  });

  app.patch('/api/v1/widget-state/:instanceId', async (req, reply) => {
    const { instanceId } = req.params as { instanceId: string };
    const { patch } = req.body as { patch: Record<string, unknown> };
    if (!patch) {
      return reply.status(400).send({ error: 'Missing required field: patch' });
    }
    const widgetState = widgetStateManager.patchState(instanceId, patch);
    if (!widgetState) {
      return reply.status(404).send({ error: 'Widget state not found' });
    }
    return reply.send(widgetState);
  });

  app.delete('/api/v1/widget-state/:instanceId', async (req, reply) => {
    const { instanceId } = req.params as { instanceId: string };
    const deleted = widgetStateManager.deleteState(instanceId);
    if (!deleted) {
      return reply.status(404).send({ error: 'Widget state not found' });
    }
    return reply.status(204).send();
  });
}
