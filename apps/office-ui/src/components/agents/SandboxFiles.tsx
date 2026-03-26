"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface FsEntry {
  name: string;
  path: string;
  kind: "file" | "dir" | "link" | "other";
  size: number;
  mtime: number;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ICON_MAP: Record<string, string> = {
  dir: "folder",
  file: "description",
  link: "link",
  other: "help_outline",
};

const EXT_ICONS: Record<string, string> = {
  ts: "code",
  tsx: "code",
  js: "javascript",
  jsx: "javascript",
  py: "code",
  rs: "code",
  go: "code",
  json: "data_object",
  yaml: "settings",
  yml: "settings",
  toml: "settings",
  md: "article",
  txt: "article",
  sh: "terminal",
  bash: "terminal",
  png: "image",
  jpg: "image",
  jpeg: "image",
  svg: "image",
  gif: "image",
  css: "palette",
  html: "web",
  lock: "lock",
};

function getFileIcon(entry: FsEntry): string {
  if (entry.kind === "dir") return "folder";
  const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_ICONS[ext] ?? "description";
}

export default function SandboxFiles({ workspaceId }: { workspaceId: string }) {
  const [currentPath, setCurrentPath] = useState("/");
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery<FsEntry[]>({
    queryKey: ["sandbox-fs", workspaceId, currentPath],
    queryFn: async () => {
      const res = await api.get("/sandbox/fs/list", {
        params: { path: currentPath, workspace_id: workspaceId },
      });
      return res.data;
    },
  });

  const mkdirMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.post("/sandbox/fs/mkdir", {
        path: `${currentPath === "/" ? "" : currentPath}/${name}`,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sandbox-fs", workspaceId, currentPath] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ path, recursive }: { path: string; recursive: boolean }) => {
      await api.post("/sandbox/fs/rm", { path, recursive });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sandbox-fs", workspaceId, currentPath] }),
  });

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.kind === "dir" && b.kind !== "dir") return -1;
      if (a.kind !== "dir" && b.kind === "dir") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [entries]);

  const breadcrumbs = useMemo(() => {
    const parts = currentPath.split("/").filter(Boolean);
    const crumbs = [{ name: "/", path: "/" }];
    let acc = "";
    for (const part of parts) {
      acc += `/${part}`;
      crumbs.push({ name: part, path: acc });
    }
    return crumbs;
  }, [currentPath]);

  const handleNavigate = (entry: FsEntry) => {
    if (entry.kind === "dir") {
      setCurrentPath(entry.path);
    } else {
      // Download file
      const url = `${api.defaults.baseURL}/sandbox/fs/download?path=${encodeURIComponent(entry.path)}&workspace_id=${workspaceId}`;
      window.open(url, "_blank");
    }
  };

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      try {
        await api.post(
          `/sandbox/fs/upload?path=${encodeURIComponent(currentPath)}&workspace_id=${workspaceId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        queryClient.invalidateQueries({ queryKey: ["sandbox-fs", workspaceId, currentPath] });
      } catch {}
    };
    input.click();
  };

  const handleNewFolder = () => {
    const name = prompt("New folder name:");
    if (name) mkdirMutation.mutate(name);
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="icon text-primary">folder_open</span>
          <span className="font-bold text-sm">Workspace Files</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNewFolder}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-surface-dark border border-border-dark rounded-lg hover:bg-accent-dark transition-colors"
          >
            <span className="icon text-sm">create_new_folder</span>
            New Folder
          </button>
          <button
            onClick={handleUpload}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <span className="icon text-sm">upload_file</span>
            Upload
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 px-4 py-2 bg-background-dark/50 border-b border-white/5 text-xs">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1">
            {i > 0 && <span className="text-text-muted">/</span>}
            <button
              onClick={() => setCurrentPath(crumb.path)}
              className={cn(
                "hover:text-primary transition-colors font-mono",
                i === breadcrumbs.length - 1 ? "text-primary font-bold" : "text-text-muted",
              )}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* File list */}
      <div className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-text-muted text-sm">Loading...</div>
        ) : sortedEntries.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">
            <span className="icon text-3xl block mb-2">folder_off</span>
            Empty directory
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {currentPath !== "/" && (
              <button
                onClick={() => {
                  const parent = currentPath.split("/").slice(0, -1).join("/") || "/";
                  setCurrentPath(parent);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-surface-dark/50 transition-colors text-left"
              >
                <span className="icon text-text-muted text-lg">arrow_upward</span>
                <span className="text-sm text-text-muted">..</span>
              </button>
            )}
            {sortedEntries.map((entry) => (
              <div
                key={entry.path}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-dark/50 transition-colors group"
              >
                <button
                  onClick={() => handleNavigate(entry)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <span className={cn("icon text-lg", entry.kind === "dir" ? "text-primary" : "text-text-muted")}>
                    {getFileIcon(entry)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{entry.name}</p>
                  </div>
                  <span className="text-[11px] text-text-muted font-mono shrink-0">
                    {entry.kind === "dir" ? "—" : formatSize(entry.size)}
                  </span>
                  <span className="text-[11px] text-text-muted shrink-0 w-28 text-right">
                    {formatDate(entry.mtime)}
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`Delete ${entry.name}?`)) return;
                    deleteMutation.mutate({ path: entry.path, recursive: entry.kind === "dir" });
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-rose-500/10"
                  title="Delete"
                >
                  <span className="icon text-sm text-rose-400">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
