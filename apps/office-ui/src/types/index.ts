// ── Core entity types ─────────────────────────────────────────────────────────

export type AgentStatus = "active" | "thinking" | "idle" | "offline" | "busy" | "deployable";

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  role: string;
  category?: string;
  description?: string;
  system_prompt?: string;
  avatar_url?: string;
  accent_color: string;
  package_id?: string;
  package_version?: string;
  status: AgentStatus;
  is_active: boolean;
  office_position?: { x: number; y: number };
  deployment_region?: string;
  sandboxed_workspace_id?: string;
  sandboxed_mission_id?: string;
  tool_permissions?: { allowed: string[]; approval_required: string[] };
  created_at: string;
  updated_at: string;
  model_provider?: ModelProvider;
}

export interface ModelProvider {
  id: string;
  workspace_id: string;
  name: string;
  provider: "claude" | "openai" | "lmstudio" | "openrouter";
  model_name: string;
  base_url?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: "owner" | "admin" | "member";
  is_active: boolean;
  last_seen_at?: string;
}

export interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  banner_url?: string;
  icon?: string;
  is_default: boolean;
  human_in_the_loop: boolean;
  guardrails: {
    human_approval_required: boolean;
    auto_scale_compute: boolean;
    audit_log_persistence: boolean;
    dark_launch_protocol: boolean;
  };
  settings: {
    sandboxed_isolation?: boolean;
    sandboxed_default_harness?: string;
    sandboxed_template?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  title?: string;
  type: "direct" | "group" | "channel" | "meeting";
  session_label?: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "user" | "agent" | "system";
  content: string;
  content_type: "text" | "markdown" | "tool_call" | "tool_result";
  status: "sending" | "streaming" | "delivered" | "failed";
  token_count?: number;
  action_buttons: ActionButton[];
  created_at: string;
}

export interface ActionButton {
  label: string;
  action_type: string;
  action_payload: Record<string, unknown>;
  style: "primary" | "secondary";
}

export interface Approval {
  id: string;
  workspace_id: string;
  agent_id: string;
  request_id: string;
  action_type: string;
  title: string;
  reasoning?: string;
  reasoning_points: { text: string; verified: boolean }[];
  proposed_changes: Record<string, unknown>;
  risk_level: "low" | "medium" | "high" | "critical";
  impact_summary?: string;
  access_permissions: { tool: string; description: string; warning_level: "ok" | "warn" }[];
  audit_trail: { label: string; detail: string; timestamp: string; status: "done" | "pending" }[];
  status: "pending" | "approved" | "rejected" | "changes_requested";
  reviewer_comment?: string;
  created_at: string;
  agent?: Agent;
}

export type RaciRole = "responsible" | "accountable" | "consulted" | "informed";

export interface Task {
  id: string;
  workspace_id: string;
  project_id?: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "backlog" | "in_progress" | "awaiting_approval" | "completed" | "cancelled";
  assigned_agent_id?: string;
  assigned_user_id?: string;
  raci_role?: RaciRole;
  progress_pct: number;
  progress_label?: string;
  tools_used: string[];
  completed_at?: string;
  created_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  task_id?: string;
  status: "planning" | "active" | "at_risk" | "complete" | "synced";
  start_date?: string;
  end_date?: string;
  progress_pct: number;
  sync_health_pct: number;
  color: string;
  goal?: string;
  goal_output?: string;
  created_by?: string;
  agents?: { agent: Agent; job_title?: string; raci_role: RaciRole }[];
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  workspace_id: string;
  name: string;
  category: "communication" | "productivity" | "development" | "custom_mcp";
  integration_type: string;
  status: "active" | "needs_attention" | "disconnected";
  settings: Record<string, unknown>;
  mcp_command?: string;
  connected_at?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  actor_id?: string;
  actor_type: "user" | "agent" | "system";
  event_type: "success" | "modification" | "integration" | "critical" | "warning" | "info";
  title: string;
  description?: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  workspace_id: string;
  user_id: string;
  category: "urgent" | "approval" | "system";
  title: string;
  body?: string;
  action_url?: string;
  action_label?: string;
  approval_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface OfficeStats {
  agents_online: number;
  agents_active: number;
  agents_idle: number;
  agents_offline: number;
  approvals_pending: number;
  workflows_today: number;
  api_calls_24h: number;
}

// ── WebSocket event types ─────────────────────────────────────────────────────

export type WSEvent =
  | { type: "message.new"; message: Message }
  | { type: "message.streaming"; message_id: string; delta: string; done: boolean }
  | { type: "agent.status"; agent_id: string; status: AgentStatus; current_task?: string }
  | { type: "agent.thinking"; agent_id: string; text: string }
  | { type: "agent.activity"; agent_id: string; activity_type: string; content: string; metadata?: Record<string, unknown> }
  | { type: "participant.status"; participant_id: string; status: AgentStatus; current_task?: string }
  | { type: "task.updated"; id: string; status: Task["status"]; progress_pct: number }
  | { type: "error"; message: string };

// ── Agent Package (agency-agents format) ─────────────────────────────────────

export interface AgentPackage {
  id: string;
  package_id: string;
  name: string;
  version: string;
  category?: string;
  source: "library" | "custom" | "local";
  definition: {
    frontmatter: {
      name: string;
      description: string;
      color?: string;
      category?: string;
      model_preference?: string;
      tools_allowed?: string[];
      tools_approval_required?: string[];
    };
    body: string; // Markdown system prompt
  };
  installed_at: string;
}
