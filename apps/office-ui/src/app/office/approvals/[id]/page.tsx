"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Approval } from "@/types";

// ── Status styling ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  Approval["status"],
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "ACTION PENDING",
    bg: "bg-orange-500/15 border-orange-500/30",
    text: "text-orange-400",
  },
  approved: {
    label: "APPROVED",
    bg: "bg-emerald-500/15 border-emerald-500/30",
    text: "text-emerald-400",
  },
  rejected: {
    label: "REJECTED",
    bg: "bg-rose-500/15 border-rose-500/30",
    text: "text-rose-400",
  },
  changes_requested: {
    label: "CHANGES REQUESTED",
    bg: "bg-amber-500/15 border-amber-500/30",
    text: "text-amber-400",
  },
};

const RISK_STYLES: Record<
  Approval["risk_level"],
  { label: string; color: string; bg: string }
> = {
  low: { label: "Low Risk", color: "text-green-400", bg: "bg-green-500/10" },
  medium: {
    label: "Medium Risk",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  high: {
    label: "High Risk",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  critical: {
    label: "Critical Risk",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
};

const TRAIL_DOT_COLOR: Record<string, string> = {
  done: "bg-emerald-400",
  pending: "bg-slate-500",
};

// ── Time formatter ─────────────────────────────────────────────────────────────

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Section cards ──────────────────────────────────────────────────────────────

function RequestHeaderCard({ approval }: { approval: Approval }) {
  const badge = STATUS_BADGE[approval.status];
  return (
    <div className="glass-panel rounded-xl p-6 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
            badge.bg,
            badge.text
          )}
        >
          <span className="icon text-sm">
            {approval.status === "pending" ? "pending" : "task_alt"}
          </span>
          {badge.label}
        </span>
        <span className="text-xs font-mono text-text-muted">
          {approval.request_id}
        </span>
      </div>
      <h1 className="text-2xl font-bold">{approval.title}</h1>
      <p className="text-xs text-text-muted font-mono">
        {formatTimestamp(approval.created_at)}
      </p>
    </div>
  );
}

function ReasoningCard({ approval }: { approval: Approval }) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-white/5">
        <span className="icon text-primary">psychology</span>
        <span className="font-bold text-sm">Reasoning</span>
      </div>
      <div className="p-4 space-y-4">
        {approval.reasoning && (
          <p className="text-sm text-slate-300 leading-relaxed">
            {approval.reasoning}
          </p>
        )}
        {approval.reasoning_points.length > 0 && (
          <div className="space-y-2">
            {approval.reasoning_points.map((point, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "icon text-base mt-0.5 shrink-0",
                    point.verified
                      ? "text-emerald-400"
                      : "text-slate-500"
                  )}
                >
                  {point.verified ? "check_circle" : "radio_button_unchecked"}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    point.verified ? "text-slate-200" : "text-slate-400"
                  )}
                >
                  {point.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProposedChangesCard({ approval }: { approval: Approval }) {
  const changes = approval.proposed_changes;
  const entries = Object.entries(changes);

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-white/5">
        <span className="icon text-primary">difference</span>
        <span className="font-bold text-sm">Proposed Changes</span>
      </div>
      <div className="p-4">
        <pre className="text-xs font-mono leading-relaxed overflow-x-auto rounded-lg bg-black/40 p-4 border border-white/5">
          {entries.map(([key, value]) => {
            const val =
              typeof value === "string" ? value : JSON.stringify(value, null, 2);
            const lines = val.split("\n");
            return lines.map((line, i) => {
              const isRemoved = line.startsWith("-");
              const isAdded = line.startsWith("+");
              return (
                <code
                  key={`${key}-${i}`}
                  className={cn(
                    "block px-2 -mx-2 rounded-sm",
                    isRemoved && "bg-red-500/15 text-rose-300",
                    isAdded && "bg-green-500/15 text-emerald-300",
                    !isRemoved && !isAdded && "text-slate-400"
                  )}
                >
                  {line}
                </code>
              );
            });
          })}
        </pre>
      </div>
    </div>
  );
}

function RiskAssessmentCard({ approval }: { approval: Approval }) {
  const risk = RISK_STYLES[approval.risk_level];
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-white/5">
        <span className="icon text-primary">shield</span>
        <span className="font-bold text-sm">Risk Assessment</span>
      </div>
      <div className="p-4 space-y-3">
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
            risk.bg
          )}
        >
          <span className={cn("icon text-lg", risk.color)}>warning</span>
          <span className={cn("text-lg font-bold", risk.color)}>
            {risk.label}
          </span>
        </div>
        {approval.impact_summary && (
          <p className="text-sm text-slate-400 leading-relaxed">
            {approval.impact_summary}
          </p>
        )}
      </div>
    </div>
  );
}

function AccessPermissionsCard({ approval }: { approval: Approval }) {
  if (approval.access_permissions.length === 0) return null;
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-white/5">
        <span className="icon text-primary">lock</span>
        <span className="font-bold text-sm">Access Permissions</span>
      </div>
      <div className="p-4 grid grid-cols-1 gap-2">
        {approval.access_permissions.map((perm, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-background-dark/50 border border-white/5"
          >
            <span
              className={cn(
                "icon text-base shrink-0",
                perm.warning_level === "warn"
                  ? "text-amber-400"
                  : "text-slate-400"
              )}
            >
              {perm.warning_level === "warn" ? "lock_open" : "lock"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{perm.tool}</p>
              <p className="text-[11px] text-text-muted truncate">
                {perm.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditTrailCard({ approval }: { approval: Approval }) {
  if (approval.audit_trail.length === 0) return null;
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-white/5">
        <span className="icon text-primary">history</span>
        <span className="font-bold text-sm">Audit Trail</span>
      </div>
      <div className="p-4">
        <div className="space-y-0">
          {approval.audit_trail.map((entry, i) => {
            const isLast = i === approval.audit_trail.length - 1;
            return (
              <div key={i} className="flex gap-3">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center shrink-0">
                  <span
                    className={cn(
                      "size-2.5 rounded-full mt-1.5 shrink-0",
                      TRAIL_DOT_COLOR[entry.status] ?? "bg-slate-500"
                    )}
                  />
                  {!isLast && (
                    <div className="w-px flex-1 bg-white/10 my-1" />
                  )}
                </div>
                {/* Content */}
                <div className={cn("pb-4 min-w-0", isLast && "pb-0")}>
                  <p className="text-xs font-bold">{entry.label}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {entry.detail}
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono mt-1">
                    {formatTimestamp(entry.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main detail page ───────────────────────────────────────────────────────────

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: approval, isLoading } = useQuery<Approval>({
    queryKey: ["approval", id],
    queryFn: () => api.get(`/approvals/${id}`).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      api.post(`/approvals/${id}/approve`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval", id] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      setComment("");
      setActionLoading(null);
    },
    onError: () => setActionLoading(null),
  });

  const requestChangesMutation = useMutation({
    mutationFn: () =>
      api.post(`/approvals/${id}/request-changes`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval", id] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      setComment("");
      setActionLoading(null);
    },
    onError: () => setActionLoading(null),
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      api.post(`/approvals/${id}/reject`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval", id] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      setComment("");
      setActionLoading(null);
    },
    onError: () => setActionLoading(null),
  });

  function handleAction(action: "approve" | "request-changes" | "reject") {
    setActionLoading(action);
    if (action === "approve") approveMutation.mutate();
    else if (action === "request-changes") requestChangesMutation.mutate();
    else rejectMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-32 glass-panel rounded-xl animate-pulse" />
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-40 glass-panel rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="lg:col-span-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 glass-panel rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="p-8 text-center">
        <span className="icon text-5xl text-text-muted">error</span>
        <p className="mt-4 font-bold">Approval not found</p>
        <Link
          href="/office/approvals"
          className="mt-2 text-primary text-sm hover:underline"
        >
          Back to queue
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Back navigation */}
      <Link
        href="/office/approvals"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
      >
        <span className="icon text-base">arrow_back</span>
        Back to Approval Queue
      </Link>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-4">
          <RequestHeaderCard approval={approval} />
          <ReasoningCard approval={approval} />
          <ProposedChangesCard approval={approval} />

          {/* Comment + actions */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="icon text-primary">comment</span>
              <span className="font-bold text-sm">Review Comment</span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment with your decision (optional)..."
              rows={3}
              className="w-full bg-surface-dark border border-border-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction("approve")}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background-dark rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <span className="icon text-sm">check_circle</span>
                {actionLoading === "approve" ? "Approving..." : "Approve"}
              </button>
              <button
                onClick={() => handleAction("request-changes")}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-200 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <span className="icon text-sm">edit_note</span>
                {actionLoading === "request-changes"
                  ? "Sending..."
                  : "Request Changes"}
              </button>
              <button
                onClick={() => handleAction("reject")}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-rose-400 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <span className="icon text-sm">cancel</span>
                {actionLoading === "reject" ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-4">
          <RiskAssessmentCard approval={approval} />
          <AccessPermissionsCard approval={approval} />
          <AuditTrailCard approval={approval} />
        </div>
      </div>
    </div>
  );
}
