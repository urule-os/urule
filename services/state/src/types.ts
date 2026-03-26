export interface Presence {
  userId: string;
  roomId: string;
  workspaceId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  metadata?: Record<string, unknown>;
}

export interface Room {
  id: string;
  workspaceId: string;
  name: string;
  type: 'office' | 'meeting' | 'private' | 'public';
  description?: string;
  capacity?: number;
  createdAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  roomId?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  creatorId: string;
  labels: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OwnershipTransfer {
  taskId: string;
  fromUserId: string;
  toUserId: string;
  reason?: string;
  timestamp: string;
}

export interface WidgetState {
  instanceId: string;
  workspaceId: string;
  state: Record<string, unknown>;
  updatedAt: string;
}
