"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types";

// -- Types --------------------------------------------------------------------

type TabFilter = "all" | "active" | "archived";

interface CreateWorkspaceForm {
  name: string;
  slug: string;
  description: string;
}

// -- Tab pill -----------------------------------------------------------------

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
        active
          ? "bg-primary/20 border border-primary/40 text-primary"
          : "bg-surface-dark border border-border-dark text-text-muted hover:border-primary/30 hover:text-slate-300"
      )}
    >
      {children}
    </button>
  );
}

// -- Status indicator ---------------------------------------------------------

function StatusIndicator({ isDefault }: { isDefault: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background-dark/60 border border-white/5">
      <span
        className={cn(
          "size-2 rounded-full",
          isDefault ? "bg-accent-success" : "bg-amber-400"
        )}
      />
      <span className="text-[10px] font-bold uppercase tracking-wide">
        {isDefault ? "Active" : "Active"}
      </span>
    </div>
  );
}

// -- Featured workspace card (default) ----------------------------------------

function FeaturedWorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <div className="glass-panel rounded-xl p-6 border-l-4 border-l-primary flex items-start gap-6 group hover:border-primary/40 transition-all">
      {/* Icon / Avatar */}
      <div className="size-20 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        {workspace.avatar_url ? (
          <img
            src={workspace.avatar_url}
            alt={workspace.name}
            className="size-20 rounded-xl object-cover"
          />
        ) : (
          <span className="icon text-4xl text-primary">
            {workspace.icon ?? "workspaces"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            Default System
          </span>
          <StatusIndicator isDefault />
        </div>
        <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">
          {workspace.name}
        </h2>
        {workspace.description && (
          <p className="text-sm text-text-muted mt-1 line-clamp-2">
            {workspace.description}
          </p>
        )}
        <p className="text-[10px] text-text-muted uppercase tracking-widest mt-2 font-mono">
          {workspace.slug}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 self-center">
        <Link
          href="/office"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-black px-5 py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <span className="icon text-sm">login</span>
          Enter Workspace
        </Link>
        <Link
          href="/office/settings"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border-dark text-text-muted hover:border-primary/30 hover:text-slate-300 font-bold text-sm transition-all"
        >
          <span className="icon text-sm">settings</span>
          Settings
        </Link>
      </div>
    </div>
  );
}

// -- Workspace grid card ------------------------------------------------------

function WorkspaceCard({
  workspace,
  agentCount,
}: {
  workspace: Workspace;
  agentCount?: number;
}) {
  return (
    <div className="glass-panel rounded-xl p-5 flex flex-col gap-4 group hover:border-primary/40 transition-all relative">
      {/* Status badge */}
      <div className="absolute top-4 right-4">
        <StatusIndicator isDefault={workspace.is_default} />
      </div>

      {/* Icon */}
      <div className="size-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        {workspace.avatar_url ? (
          <img
            src={workspace.avatar_url}
            alt={workspace.name}
            className="size-14 rounded-xl object-cover"
          />
        ) : (
          <span className="icon text-3xl text-primary">
            {workspace.icon ?? "workspaces"}
          </span>
        )}
      </div>

      {/* Identity */}
      <div className="pr-20">
        <h3 className="text-lg font-bold group-hover:text-primary transition-colors leading-tight">
          {workspace.name}
        </h3>
        {workspace.description && (
          <p className="text-sm text-text-muted mt-1 line-clamp-2">
            {workspace.description}
          </p>
        )}
      </div>

      {/* Agent count badge */}
      {agentCount !== undefined && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="icon text-sm">smart_toy</span>
          <span className="font-bold">
            {agentCount} agent{agentCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2">
        <Link
          href={`/office/workspaces/${workspace.id}`}
          className="flex-1 text-xs font-bold px-4 py-2 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-background-dark transition-all text-center"
        >
          Manage
        </Link>
        <Link
          href={`/office/workspaces/${workspace.id}/members`}
          className="flex-1 text-xs font-bold px-4 py-2 rounded-lg border border-border-dark text-text-muted hover:border-primary/30 hover:text-slate-300 transition-all text-center"
        >
          Members
        </Link>
      </div>
    </div>
  );
}

// -- Create workspace modal ---------------------------------------------------

function CreateWorkspaceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateWorkspaceForm>({
    name: "",
    slug: "",
    description: "",
  });
  const [autoSlug, setAutoSlug] = useState(true);

  const createMutation = useMutation({
    mutationFn: (payload: CreateWorkspaceForm) =>
      api.post("/workspaces", payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setForm({ name: "", slug: "", description: "" });
      setAutoSlug(true);
      onClose();
    },
  });

  // Auto-generate slug from name
  const handleNameChange = useCallback(
    (value: string) => {
      setForm((prev) => ({
        ...prev,
        name: value,
        slug: autoSlug
          ? value
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "")
          : prev.slug,
      }));
    },
    [autoSlug]
  );

  const handleSlugChange = useCallback((value: string) => {
    setAutoSlug(false);
    setForm((prev) => ({
      ...prev,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-"),
    }));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;
    createMutation.mutate(form);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg glass-panel rounded-2xl p-8 space-y-6 border border-border-dark shadow-2xl animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="icon text-primary text-xl">add_circle</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">Create Workspace</h2>
              <p className="text-xs text-text-muted">
                Set up a new workspace for your team
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-surface-dark transition-colors"
          >
            <span className="icon text-text-muted">close</span>
          </button>
        </div>

        {/* Name field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Workspace Name
          </label>
          <input
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My Workspace"
            className="w-full px-4 py-3 bg-background-dark/50 border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>

        {/* Slug field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Slug
          </label>
          <input
            value={form.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="my-workspace"
            className="w-full px-4 py-3 bg-background-dark/50 border border-primary/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-[10px] text-text-muted">
            URL-friendly identifier. Only lowercase letters, numbers, and
            hyphens.
          </p>
        </div>

        {/* Description field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
            placeholder="Describe what this workspace is for..."
            className="w-full px-4 py-3 bg-background-dark/50 border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Error */}
        {createMutation.isError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
            <span className="icon text-base">error</span>
            Failed to create workspace. Please try again.
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-border-dark text-text-muted hover:border-primary/30 hover:text-slate-300 font-bold text-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              !form.name.trim() ||
              !form.slug.trim() ||
              createMutation.isPending
            }
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-black px-6 py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <>
                <span className="icon text-sm animate-spin">
                  progress_activity
                </span>
                Creating...
              </>
            ) : (
              <>
                <span className="icon text-sm">add</span>
                Create Workspace
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// -- Main page ----------------------------------------------------------------

export default function WorkspacesPage() {
  const [tab, setTab] = useState<TabFilter>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: workspacesRaw,
    isLoading,
    isError,
  } = useQuery<Workspace[] | Workspace>({
    queryKey: ["workspaces"],
    queryFn: () => api.get("/workspaces").then((r) => r.data),
  });

  // Normalize: API might return a single workspace or an array
  const workspaces: Workspace[] = Array.isArray(workspacesRaw)
    ? workspacesRaw
    : workspacesRaw
      ? [workspacesRaw]
      : [];

  const defaultWorkspace = workspaces.find((w) => w.is_default);
  const otherWorkspaces = workspaces.filter((w) => !w.is_default);

  // Client-side tab filter (all workspaces are currently "active";
  // archived status could be added to the Workspace type later)
  const filteredOthers = otherWorkspaces.filter(() => {
    if (tab === "archived") return false; // No archived flag yet
    return true;
  });

  // -- Loading ----------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-surface-dark rounded-lg animate-pulse" />
          <div className="h-10 w-48 bg-surface-dark rounded-lg animate-pulse" />
        </div>
        <div className="h-40 bg-surface-dark rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="glass-panel rounded-xl p-5 h-52 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // -- Error ------------------------------------------------------------------

  if (isError) {
    return (
      <div className="p-8">
        <div className="glass-panel rounded-xl p-16 text-center">
          <span className="icon text-5xl text-text-muted">error_outline</span>
          <p className="mt-4 font-bold text-lg">
            Failed to load workspaces
          </p>
          <p className="text-text-muted text-sm mt-1">
            Check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  // -- Empty state ------------------------------------------------------------

  if (workspaces.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">Workspaces</h1>
            <p className="text-text-muted mt-1 text-sm">
              Manage your organization workspaces
            </p>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-16 text-center">
          <span className="icon text-5xl text-text-muted">workspaces</span>
          <p className="mt-4 font-bold text-lg">No workspaces found</p>
          <p className="text-text-muted text-sm mt-1">
            Create your first workspace to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-black px-6 py-3 rounded-lg shadow-lg shadow-primary/20 transition-all"
          >
            <span className="icon text-sm">add</span>
            Create First Workspace
          </button>
        </div>
        <CreateWorkspaceModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    );
  }

  // -- Render -----------------------------------------------------------------

  return (
    <div className="p-8 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Workspaces</h1>
          <p className="text-text-muted mt-1 text-sm">
            {workspaces.length} workspace
            {workspaces.length !== 1 ? "s" : ""} in your organization
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-black px-5 py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <span className="icon text-sm">add</span>
          Create New Workspace
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-2">
        <TabPill active={tab === "all"} onClick={() => setTab("all")}>
          All Workspaces
        </TabPill>
        <TabPill active={tab === "active"} onClick={() => setTab("active")}>
          Active
        </TabPill>
        <TabPill
          active={tab === "archived"}
          onClick={() => setTab("archived")}
        >
          Archived
        </TabPill>
      </div>

      {/* Featured default workspace */}
      {defaultWorkspace && tab !== "archived" && (
        <FeaturedWorkspaceCard workspace={defaultWorkspace} />
      )}

      {/* Workspace grid */}
      {filteredOthers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOthers.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      ) : tab === "archived" ? (
        <div className="glass-panel rounded-xl p-16 text-center">
          <span className="icon text-5xl text-text-muted">inventory_2</span>
          <p className="mt-4 font-bold text-lg">No archived workspaces</p>
          <p className="text-text-muted text-sm mt-1">
            Archived workspaces will appear here
          </p>
        </div>
      ) : (
        /* When only the default workspace exists, show a subtle nudge */
        !defaultWorkspace && (
          <div className="glass-panel rounded-xl p-16 text-center">
            <span className="icon text-5xl text-text-muted">workspaces</span>
            <p className="mt-4 font-bold text-lg">No additional workspaces</p>
            <p className="text-text-muted text-sm mt-1">
              Create a workspace to organize your agents and teams
            </p>
          </div>
        )
      )}

      {/* Create workspace modal */}
      <CreateWorkspaceModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
