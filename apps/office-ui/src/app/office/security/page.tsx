"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types";

// ── Security config types ────────────────────────────────────────────────────

interface AuditLogEntry {
  id: string;
  actor_type: string;
  event_type: string;
  title: string;
  description?: string;
  created_at: string;
}

const SECURITY_POLICIES = [
  {
    id: "human_approval_required",
    icon: "verified_user",
    title: "Human Approval Required",
    description: "Manual verification for AI-generated code commits and destructive actions",
    color: "primary",
  },
  {
    id: "audit_log_persistence",
    icon: "history",
    title: "Audit Log Persistence",
    description: "Store agent-human interaction logs for compliance (90 days retention)",
    color: "emerald",
  },
  {
    id: "dark_launch_protocol",
    icon: "science",
    title: "Dark Launch Protocol",
    description: "Sandbox new agents in isolated environment before workspace deployment",
    color: "amber",
  },
  {
    id: "auto_scale_compute",
    icon: "speed",
    title: "Auto-scale Compute",
    description: "Provision additional compute resources during peak agent activity cycles",
    color: "indigo",
  },
] as const;

const COMPLIANCE_BADGES = [
  { label: "SOC2 Type II", icon: "shield", status: "active" },
  { label: "AES-256-GCM", icon: "lock", status: "active" },
  { label: "TLS 1.3", icon: "https", status: "active" },
  { label: "RBAC Enabled", icon: "admin_panel_settings", status: "active" },
];

// ── Main page ────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "audit" | "access">("overview");

  const { data: workspace } = useQuery<Workspace>({
    queryKey: ["workspace"],
    queryFn: () => api.get("/workspaces/current").then((r) => r.data),
  });

  const { data: auditLogs = [] } = useQuery<AuditLogEntry[]>({
    queryKey: ["security-logs"],
    queryFn: () => api.get("/logs", { params: { limit: 20 } }).then((r) => r.data),
    refetchInterval: 30000,
  });

  const toggleGuardrail = useMutation({
    mutationFn: (update: Record<string, boolean>) =>
      api.patch("/workspaces/current", { guardrails: { ...workspace?.guardrails, ...update } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace"] }),
  });

  const guardrails = workspace?.guardrails ?? {
    human_approval_required: true,
    audit_log_persistence: true,
    dark_launch_protocol: false,
    auto_scale_compute: false,
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Security & Compliance</h1>
          <p className="text-text-muted mt-1 text-sm">
            Manage guardrails, audit logs, and access controls
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-success/10 border border-accent-success/20">
          <span className="size-2 rounded-full bg-accent-success animate-pulse" />
          <span className="text-[10px] font-bold text-accent-success uppercase tracking-widest">
            All Systems Secure
          </span>
        </div>
      </div>

      {/* Compliance badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {COMPLIANCE_BADGES.map((badge) => (
          <div
            key={badge.label}
            className="glass-panel rounded-xl p-4 flex items-center gap-3"
          >
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="icon text-primary">{badge.icon}</span>
            </div>
            <div>
              <p className="text-sm font-bold">{badge.label}</p>
              <p className="text-[10px] text-accent-success font-bold uppercase tracking-wider">
                Active
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-dark/50 p-1 rounded-lg w-fit">
        {(["overview", "audit", "access"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === tab
                ? "bg-primary text-background-dark"
                : "text-text-muted hover:text-white"
            )}
          >
            {tab === "overview" ? "Security Policies" : tab === "audit" ? "Audit Log" : "Access Control"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Guardrails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SECURITY_POLICIES.map((policy) => {
              const enabled = guardrails[policy.id as keyof typeof guardrails] ?? false;
              return (
                <div
                  key={policy.id}
                  className={cn(
                    "glass-panel rounded-xl p-6 flex items-start gap-4 transition-all",
                    enabled ? "border-l-4 border-l-primary" : "border-l-4 border-l-slate-700"
                  )}
                >
                  <div className={cn(
                    "size-10 rounded-lg flex items-center justify-center shrink-0",
                    enabled ? "bg-primary/10" : "bg-slate-800"
                  )}>
                    <span className={cn("icon", enabled ? "text-primary" : "text-slate-500")}>
                      {policy.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{policy.title}</p>
                    <p className="text-xs text-text-muted mt-1">{policy.description}</p>
                  </div>
                  <button
                    onClick={() => toggleGuardrail.mutate({ [policy.id]: !enabled })}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      enabled ? "bg-primary" : "bg-slate-700"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-5 rounded-full bg-white shadow transform transition-transform",
                        enabled ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Encryption info */}
          <div className="glass-panel rounded-xl p-6 bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="icon text-primary text-xl">encrypted</span>
              <h3 className="font-bold">Encryption & Data Protection</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "API Keys", value: "Fernet Symmetric", detail: "At-rest encryption for stored provider credentials" },
                { label: "Transport", value: "TLS 1.3", detail: "End-to-end encrypted communication" },
                { label: "Passwords", value: "bcrypt", detail: "Salted password hashing with cost factor 12" },
              ].map((item) => (
                <div key={item.label} className="bg-background-dark/30 rounded-lg p-4">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{item.label}</p>
                  <p className="text-lg font-black mt-1">{item.value}</p>
                  <p className="text-[11px] text-text-muted mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="icon text-primary">history</span>
              <h2 className="font-bold">Recent Security Events</h2>
            </div>
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">
              Last 20 events
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center">
              <span className="icon text-5xl text-text-muted">shield</span>
              <p className="mt-4 font-bold">No security events recorded yet</p>
              <p className="text-text-muted text-sm mt-1">Events will appear here as agents operate</p>
            </div>
          ) : (
            <div className="glass-panel rounded-xl divide-y divide-white/5">
              {auditLogs.map((log) => {
                const typeColors: Record<string, string> = {
                  success: "text-accent-success",
                  critical: "text-rose-500",
                  warning: "text-amber-400",
                  modification: "text-blue-400",
                  integration: "text-primary",
                  info: "text-slate-400",
                };
                return (
                  <div key={log.id} className="px-5 py-3 flex items-start gap-4">
                    <span className={cn("icon text-sm mt-0.5", typeColors[log.event_type] ?? "text-slate-400")}>
                      {log.event_type === "critical" ? "error" : log.event_type === "warning" ? "warning" : "info"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{log.title}</p>
                      {log.description && (
                        <p className="text-xs text-text-muted mt-0.5 truncate">{log.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-mono text-text-muted">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                      <p className="text-[9px] text-text-muted capitalize">{log.actor_type}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "access" && (
        <div className="space-y-6">
          {/* RBAC overview */}
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="icon text-primary">group</span>
              <h3 className="font-bold">Role-Based Access Control</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  role: "Owner",
                  permissions: ["Full workspace control", "Manage billing", "Delete workspace", "Manage all members"],
                  color: "rose",
                },
                {
                  role: "Admin",
                  permissions: ["Manage agents", "Approve actions", "View audit logs", "Manage integrations"],
                  color: "primary",
                },
                {
                  role: "Member",
                  permissions: ["Chat with agents", "View dashboard", "Create tasks", "Submit for approval"],
                  color: "slate",
                },
              ].map((item) => (
                <div key={item.role} className="bg-background-dark/30 rounded-xl p-5 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="icon text-sm text-primary">badge</span>
                    <span className="text-sm font-bold">{item.role}</span>
                  </div>
                  <ul className="space-y-2">
                    {item.permissions.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="icon text-xs text-accent-success">check_circle</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Agent permissions summary */}
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="icon text-primary">smart_toy</span>
              <h3 className="font-bold">Agent Tool Permissions</h3>
            </div>
            <p className="text-sm text-text-muted mb-4">
              Each agent has granular tool permissions configured during creation.
              Tools marked as &quot;approval required&quot; trigger human-in-the-loop verification.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { tool: "GitHub Read", level: "auto", icon: "code" },
                { tool: "GitHub Write", level: "approval", icon: "edit" },
                { tool: "Terminal", level: "approval", icon: "terminal" },
                { tool: "File System", level: "auto", icon: "folder" },
                { tool: "Database Read", level: "auto", icon: "database" },
                { tool: "Database Write", level: "approval", icon: "edit_note" },
                { tool: "Web Search", level: "auto", icon: "travel_explore" },
                { tool: "Deploy", level: "approval", icon: "rocket_launch" },
              ].map((t) => (
                <div key={t.tool} className="bg-background-dark/30 rounded-lg p-3 flex items-center gap-3">
                  <span className="icon text-sm text-primary">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{t.tool}</p>
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      t.level === "auto" ? "text-accent-success" : "text-amber-400"
                    )}>
                      {t.level === "auto" ? "Auto-approved" : "Requires approval"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer status */}
      <div className="flex items-center justify-between text-[10px] text-text-muted font-mono uppercase tracking-widest pt-4 border-t border-white/5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="icon text-xs">shield</span> SOC2 Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <span className="icon text-xs">history</span> Session Logged
          </span>
        </div>
        <span>Urule Security v0.1.0</span>
      </div>
    </div>
  );
}
