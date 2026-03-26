"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Workspace, ModelProvider } from "@/types";

// ── Constants ────────────────────────────────────────────────────────────────

const PROVIDER_OPTIONS = [
  {
    value: "claude",
    label: "Claude",
    icon: "auto_awesome",
    color: "#d97706",
    description: "Anthropic Claude models",
    requiresKey: true,
    models: [
      "claude-haiku-4-5-20251001",
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
    ],
    modelLabels: {
      "claude-haiku-4-5-20251001": "Haiku 4.5 — cheapest, fast",
      "claude-sonnet-4-20250514": "Sonnet 4 — mid-tier",
      "claude-opus-4-20250514": "Opus 4 — most capable, expensive",
    },
  },
  {
    value: "openai",
    label: "OpenAI",
    icon: "rocket_launch",
    color: "#10b981",
    description: "GPT & o-series models",
    requiresKey: true,
    models: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "o3",
      "o4-mini",
    ],
  },
  {
    value: "lmstudio",
    label: "LM Studio",
    icon: "memory",
    color: "#8b5cf6",
    description: "Local models via LM Studio",
    requiresKey: false,
    models: [
      "llama3.3",
      "llama3.1",
      "mistral",
      "codellama",
      "deepseek-coder-v2",
      "qwen2.5-coder",
    ],
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    icon: "hub",
    color: "#ec4899",
    description: "Multi-model gateway",
    requiresKey: true,
    models: [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "meta-llama/llama-3.1-405b",
      "google/gemini-2.0-flash",
    ],
  },
] as const;

const HARNESS_OPTIONS = [
  { value: "claudecode", label: "Claude Code", icon: "auto_awesome" },
  { value: "opencode", label: "OpenCode", icon: "code" },
  { value: "amp", label: "Amp", icon: "bolt" },
] as const;

const TEMPLATE_OPTIONS = [
  { value: "default", label: "Default", desc: "Standard development environment" },
  { value: "developer", label: "Developer", desc: "Full toolchain with git, node, python" },
  { value: "minimal", label: "Minimal", desc: "Lightweight container, shell only" },
  { value: "datascience", label: "Data Science", desc: "Python, Jupyter, pandas, numpy" },
] as const;

// ── Toggle switch component ──────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-primary" : "bg-surface-dark",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

// ── Toast feedback ───────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl text-sm font-bold animate-in slide-in-from-bottom-4",
        type === "success"
          ? "bg-accent-success/10 border-accent-success/30 text-accent-success"
          : "bg-red-500/10 border-red-500/30 text-red-400"
      )}
    >
      <span className="icon text-lg">
        {type === "success" ? "check_circle" : "error"}
      </span>
      {message}
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <span className="icon text-primary text-xl">{icon}</span>
      </div>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-text-muted mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// ── Provider card ────────────────────────────────────────────────────────────

function ProviderCard({
  provider,
  onTest,
  onDelete,
  onSetDefault,
  testingId,
}: {
  provider: ModelProvider;
  onTest: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  testingId: string | null;
}) {
  const opt = PROVIDER_OPTIONS.find((p) => p.value === provider.provider);
  const isTesting = testingId === provider.id;

  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-5 flex flex-col gap-3 border transition-all",
        provider.is_default
          ? "border-primary/40 bg-primary/5"
          : "border-border-dark/50 hover:border-primary/20"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="size-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${opt?.color ?? "#0db9f2"}20` }}
          >
            <span className="icon text-xl" style={{ color: opt?.color ?? "#0db9f2" }}>
              {opt?.icon ?? "psychology"}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm">{provider.name}</p>
              {provider.is_default && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted">
              {provider.provider} / {provider.model_name}
            </p>
          </div>
        </div>
        <div
          className={cn(
            "size-2 rounded-full mt-2",
            provider.is_active ? "bg-accent-success" : "bg-slate-500"
          )}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onTest(provider.id)}
          disabled={isTesting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-surface-dark border border-border-dark/50 hover:border-primary/30 transition-colors disabled:opacity-50"
        >
          <span className={cn("icon text-sm", isTesting && "animate-spin")}>
            {isTesting ? "progress_activity" : "play_arrow"}
          </span>
          {isTesting ? "Testing..." : "Test"}
        </button>
        {!provider.is_default && (
          <button
            onClick={() => onSetDefault(provider.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-surface-dark border border-border-dark/50 hover:border-primary/30 transition-colors"
          >
            <span className="icon text-sm">star</span>
            Set Default
          </button>
        )}
        <button
          onClick={() => onDelete(provider.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-surface-dark border border-border-dark/50 hover:border-red-500/30 hover:text-red-400 transition-colors ml-auto"
        >
          <span className="icon text-sm">delete</span>
        </button>
      </div>
    </div>
  );
}

// ── Add provider form ────────────────────────────────────────────────────────

function AddProviderForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [modelName, setModelName] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [providerName, setProviderName] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const opt = PROVIDER_OPTIONS.find((p) => p.value === selectedProvider);

  const addProvider = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post("/providers", payload),
    onSuccess,
  });

  function handleSubmit() {
    const finalModel = customModel || modelName;
    if (!selectedProvider || !finalModel) return;

    addProvider.mutate({
      name: providerName || `${opt?.label ?? selectedProvider} - ${finalModel}`,
      provider: selectedProvider,
      model_name: finalModel,
      api_key: apiKey || undefined,
      base_url: baseUrl || undefined,
      is_default: isDefault,
    });
  }

  // Auto-set first model when provider changes
  useEffect(() => {
    if (opt && opt.models.length > 0) {
      setModelName(opt.models[0]);
      setCustomModel("");
      setProviderName("");
      setApiKey("");
      setBaseUrl(selectedProvider === "lmstudio" ? "http://host.docker.internal:1234" : "");
    }
  }, [selectedProvider, opt]);

  return (
    <div className="space-y-5">
      {/* Provider selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PROVIDER_OPTIONS.map((p) => (
          <button
            key={p.value}
            onClick={() => setSelectedProvider(p.value)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
              selectedProvider === p.value
                ? "border-primary bg-primary/5"
                : "border-border-dark/50 hover:border-primary/30 bg-surface-dark/30"
            )}
          >
            <div
              className="size-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${p.color}20` }}
            >
              <span className="icon text-xl" style={{ color: p.color }}>
                {p.icon}
              </span>
            </div>
            <span className="text-sm font-bold">{p.label}</span>
            <span className="text-[10px] text-text-muted">{p.description}</span>
          </button>
        ))}
      </div>

      {selectedProvider && opt && (
        <div className="space-y-4 pt-2">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Display Name
            </label>
            <input
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder={`${opt.label} - ${modelName || "model"}`}
              className="w-full px-4 py-3 bg-background-dark/50 border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Model select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Model
            </label>
            <select
              value={modelName}
              onChange={(e) => {
                setModelName(e.target.value);
                if (e.target.value !== "__custom__") setCustomModel("");
              }}
              className="w-full px-4 py-3 bg-background-dark/50 border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {opt.models.map((m) => (
                <option key={m} value={m}>
                  {"modelLabels" in opt ? (opt.modelLabels as Record<string, string>)[m] ?? m : m}
                </option>
              ))}
              <option value="__custom__">Custom model name...</option>
            </select>
            {modelName === "__custom__" && (
              <input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="Enter custom model name"
                className="w-full mt-2 px-4 py-3 bg-background-dark/50 border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </div>

          {/* API Key */}
          {opt.requiresKey && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`${opt.label} API key`}
                  className="w-full px-4 py-3 pr-12 bg-background-dark/50 border border-primary/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary"
                >
                  <span className="icon text-lg">
                    {showKey ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <p className="text-[10px] text-text-muted">
                Encrypted with Fernet before storage. Never exposed in API responses.
              </p>
            </div>
          )}

          {/* Base URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Base URL{" "}
              <span className="text-text-muted/60 normal-case tracking-normal">
                (optional{selectedProvider === "lmstudio" ? ", defaults to localhost:1234" : ""})
              </span>
            </label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={
                selectedProvider === "lmstudio"
                  ? "http://host.docker.internal:1234"
                  : selectedProvider === "openrouter"
                  ? "https://openrouter.ai/api/v1"
                  : "Leave blank for default"
              }
              className="w-full px-4 py-3 bg-background-dark/50 border border-primary/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Set as default */}
          <div className="flex items-center justify-between py-3 border-t border-border-dark/50">
            <div className="space-y-0.5">
              <p className="text-sm font-bold">Set as default provider</p>
              <p className="text-xs text-text-muted">
                New agents will use this provider unless overridden
              </p>
            </div>
            <Toggle checked={isDefault} onChange={setIsDefault} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={
                addProvider.isPending ||
                !selectedProvider ||
                (!customModel && !modelName) ||
                (opt.requiresKey && !apiKey)
              }
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-black px-6 py-3 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {addProvider.isPending ? (
                <>
                  <span className="icon text-sm animate-spin">progress_activity</span>
                  Adding...
                </>
              ) : (
                <>
                  <span className="icon text-sm">add</span>
                  Add Provider
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-3 text-sm font-bold text-text-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main settings page ───────────────────────────────────────────────────────

export default function WorkspaceSettingsPage() {
  const queryClient = useQueryClient();

  // ── Local form state ─────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sandboxedIsolation, setSandboxedIsolation] = useState(false);
  const [defaultHarness, setDefaultHarness] = useState("claudecode");
  const [defaultTemplate, setDefaultTemplate] = useState("default");
  const [humanApproval, setHumanApproval] = useState(true);
  const [auditLog, setAuditLog] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [libraryTab, setLibraryTab] = useState<"skill" | "command" | "agent" | "workspace-template">("skill");
  const [libraryEditItem, setLibraryEditItem] = useState<{ name: string; content: string } | null>(null);

  // ── Toast state ────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // ── Fetch workspace ────────────────────────────────────────────────────
  const {
    data: workspace,
    isLoading,
    isError,
  } = useQuery<Workspace>({
    queryKey: ["workspace-current"],
    queryFn: () => api.get("/workspaces/current").then((r) => r.data),
  });

  // ── Fetch providers ────────────────────────────────────────────────────
  const { data: providers = [] } = useQuery<ModelProvider[]>({
    queryKey: ["providers"],
    queryFn: () => api.get("/providers").then((r) => r.data),
  });

  // ── Sandbox library ───────────────────────────────────────────────────
  const { data: healthData } = useQuery<{ sandboxed: string }>({
    queryKey: ["health"],
    queryFn: () => axios.get("/health").then((r) => r.data),
    staleTime: 60000,
    retry: false,
  });
  const sandboxedAvailable = healthData?.sandboxed === "ok";

  const { data: libraryStatus } = useQuery<{
    branch?: string;
    clean?: boolean;
    remote?: string;
  }>({
    queryKey: ["sandbox-library-status"],
    queryFn: () => api.get("/sandbox/library/status").then((r) => r.data),
    enabled: sandboxedAvailable,
  });

  const { data: libraryItems = [] } = useQuery<{ name: string; description?: string }[]>({
    queryKey: ["sandbox-library", libraryTab],
    queryFn: () => api.get(`/sandbox/library/${libraryTab}`).then((r) => r.data),
    enabled: sandboxedAvailable,
  });

  const librarySync = useMutation({
    mutationFn: () => api.post("/sandbox/library/sync"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sandbox-library"] });
      queryClient.invalidateQueries({ queryKey: ["sandbox-library-status"] });
      setToast({ message: "Library synced from remote", type: "success" });
    },
    onError: () => setToast({ message: "Failed to sync library", type: "error" }),
  });

  const librarySave = useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      api.put(`/sandbox/library/${libraryTab}/${name}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sandbox-library"] });
      setLibraryEditItem(null);
      setToast({ message: "Library item saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save item", type: "error" }),
  });

  const libraryDelete = useMutation({
    mutationFn: (name: string) => api.delete(`/sandbox/library/${libraryTab}/${name}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sandbox-library"] });
      setToast({ message: "Library item deleted", type: "success" });
    },
    onError: () => setToast({ message: "Failed to delete item", type: "error" }),
  });

  // Sync local state from fetched workspace
  useEffect(() => {
    if (!workspace) return;
    setName(workspace.name);
    setDescription(workspace.description ?? "");
    setSandboxedIsolation(workspace.settings?.sandboxed_isolation ?? false);
    setDefaultHarness(
      workspace.settings?.sandboxed_default_harness ?? "claudecode"
    );
    setDefaultTemplate(workspace.settings?.sandboxed_template ?? "default");
    setHumanApproval(workspace.guardrails?.human_approval_required ?? true);
    setAuditLog(workspace.guardrails?.audit_log_persistence ?? true);
  }, [workspace]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const saveGeneral = useMutation({
    mutationFn: (payload: {
      name: string;
      description: string;
      settings: Record<string, unknown>;
    }) => api.patch("/workspaces/current", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-current"] });
      setToast({ message: "Workspace settings saved", type: "success" });
    },
    onError: () => {
      setToast({ message: "Failed to save settings", type: "error" });
    },
  });

  const saveGuardrails = useMutation({
    mutationFn: (payload: {
      human_approval_required: boolean;
      audit_log_persistence: boolean;
    }) => api.patch("/workspaces/current/guardrails", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-current"] });
      setToast({ message: "Guardrails updated", type: "success" });
    },
    onError: () => {
      setToast({ message: "Failed to update guardrails", type: "error" });
    },
  });

  const deleteProvider = useMutation({
    mutationFn: (id: string) => api.delete(`/providers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      setToast({ message: "Provider removed", type: "success" });
    },
    onError: () => {
      setToast({ message: "Failed to remove provider", type: "error" });
    },
  });

  const setDefaultProvider = useMutation({
    mutationFn: (id: string) => api.post(`/providers/${id}/set-default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      setToast({ message: "Default provider updated", type: "success" });
    },
    onError: () => {
      setToast({ message: "Failed to set default provider", type: "error" });
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────
  function handleSaveGeneral() {
    saveGeneral.mutate({
      name,
      description,
      settings: {
        ...(workspace?.settings ?? {}),
        sandboxed_isolation: sandboxedIsolation,
        sandboxed_default_harness: defaultHarness,
        sandboxed_template: defaultTemplate,
      },
    });
  }

  function handleSaveGuardrails() {
    saveGuardrails.mutate({
      human_approval_required: humanApproval,
      audit_log_persistence: auditLog,
    });
  }

  const handleCopyId = useCallback(() => {
    if (!workspace) return;
    navigator.clipboard.writeText(workspace.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [workspace]);

  async function handleTestProvider(id: string) {
    setTestingId(id);
    try {
      await api.post(`/providers/${id}/test`);
      setToast({ message: "Connection successful!", type: "success" });
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Connection failed"
          : "Connection failed";
      setToast({ message: msg, type: "error" });
    } finally {
      setTestingId(null);
    }
  }

  // ── Loading / Error states ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 w-64 bg-surface-dark rounded-lg animate-pulse" />
        <div className="glass-panel rounded-xl p-8 h-64 animate-pulse" />
        <div className="glass-panel rounded-xl p-8 h-80 animate-pulse" />
      </div>
    );
  }

  if (isError || !workspace) {
    return (
      <div className="p-8">
        <div className="glass-panel rounded-xl p-16 text-center">
          <span className="icon text-5xl text-text-muted">error_outline</span>
          <p className="mt-4 font-bold text-lg">
            Failed to load workspace settings
          </p>
          <p className="text-text-muted text-sm mt-1">
            Check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  // ── Derived data ───────────────────────────────────────────────────────
  const cloudProviders = providers.filter(
    (p) => p.provider === "claude" || p.provider === "openai" || p.provider === "openrouter"
  );
  const localProviders = providers.filter((p) => p.provider === "lmstudio");

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-black">Workspace Settings</h1>
        <p className="text-text-muted mt-1 text-sm">
          Configure your workspace, AI providers, execution environment, and guardrails.
        </p>
      </div>

      {/* ── AI Providers ─────────────────────────────────────────────── */}
      <section className="glass-panel rounded-xl p-8 space-y-6">
        <div className="flex items-start justify-between">
          <SectionHeader
            icon="psychology"
            title="AI Providers"
            description="Manage API keys and model connections. Agents can use different providers in the same workspace."
          />
          {!showAddProvider && (
            <button
              onClick={() => setShowAddProvider(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-black px-4 py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] shrink-0"
            >
              <span className="icon text-sm">add</span>
              Add Provider
            </button>
          )}
        </div>

        {/* Summary bar */}
        {providers.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="icon text-sm text-primary">cloud</span>
              <span className="font-bold text-primary">{cloudProviders.length}</span>
              <span className="text-text-muted">cloud</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              <span className="icon text-sm text-purple-400">computer</span>
              <span className="font-bold text-purple-400">{localProviders.length}</span>
              <span className="text-text-muted">local</span>
            </div>
            {providers.length > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-success/10 border border-accent-success/20">
                <span className="icon text-sm text-accent-success">sync</span>
                <span className="text-text-muted">
                  Agents can share results across providers
                </span>
              </div>
            )}
          </div>
        )}

        {/* Existing providers */}
        {providers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                onTest={handleTestProvider}
                onDelete={(id) => deleteProvider.mutate(id)}
                onSetDefault={(id) => setDefaultProvider.mutate(id)}
                testingId={testingId}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {providers.length === 0 && !showAddProvider && (
          <div className="text-center py-8">
            <span className="icon text-5xl text-text-muted/40">psychology</span>
            <p className="text-sm text-text-muted mt-3">
              No providers configured yet. Add one to start using AI agents.
            </p>
          </div>
        )}

        {/* Add provider form */}
        {showAddProvider && (
          <div className="border-t border-border-dark/50 pt-6">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <span className="icon text-primary text-lg">add_circle</span>
              Add New Provider
            </h3>
            <AddProviderForm
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["providers"] });
                setShowAddProvider(false);
                setToast({ message: "Provider added successfully", type: "success" });
              }}
              onCancel={() => setShowAddProvider(false)}
            />
          </div>
        )}

        {/* Multi-provider collaboration info */}
        {providers.length > 1 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <span className="icon text-primary mt-0.5">groups</span>
            <div>
              <p className="text-xs font-bold text-primary">
                Multi-Provider Collaboration
              </p>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                Agents running on different providers (e.g. Claude for reasoning, LM Studio
                for local tasks) can collaborate in group conversations. Create a
                conversation with multiple agents and they'll see each other's messages
                and share results automatically.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── General Settings ─────────────────────────────────────────────── */}
      <section className="glass-panel rounded-xl p-8 space-y-6">
        <SectionHeader
          icon="tune"
          title="General Settings"
          description="Basic workspace identity and metadata."
        />

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Workspace Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-background-dark/50 border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="My Workspace"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-background-dark/50 border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Describe your workspace..."
          />
        </div>

        {/* Workspace ID (read-only) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Workspace ID
          </label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={workspace.id}
              className="flex-1 px-4 py-3 bg-background-dark/80 border border-border-dark rounded-lg text-sm font-mono text-text-muted cursor-default"
            />
            <button
              onClick={handleCopyId}
              className="px-4 py-3 bg-surface-dark border border-border-dark rounded-lg text-sm font-bold hover:border-primary/30 transition-colors flex items-center gap-2"
            >
              <span className="icon text-base">
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Execution & Isolation ────────────────────────────────────────── */}
      <section className="glass-panel rounded-xl p-8 space-y-6">
        <SectionHeader
          icon="security"
          title="Execution & Isolation"
          description="Control how agents are executed and sandboxed."
        />

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <span className="icon text-primary mt-0.5">info</span>
          <div>
            <p className="text-xs font-bold text-primary">
              sandboxed.sh Integration
            </p>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
              Sandboxed execution requires a Linux host with systemd-nspawn.
              Start with:{" "}
              <code className="px-1.5 py-0.5 bg-background-dark/60 rounded text-primary font-mono">
                make dev-sandboxed
              </code>
            </p>
          </div>
        </div>

        {/* Agent Isolation toggle */}
        <div className="flex items-center justify-between py-3 border-b border-border-dark/50">
          <div className="space-y-0.5">
            <p className="text-sm font-bold">Agent Isolation</p>
            <p className="text-xs text-text-muted">
              Run agents in isolated sandboxed containers
            </p>
          </div>
          <Toggle
            checked={sandboxedIsolation}
            onChange={setSandboxedIsolation}
          />
        </div>

        {/* Default Harness */}
        <div className="flex items-center justify-between py-3 border-b border-border-dark/50">
          <div className="space-y-0.5">
            <p className="text-sm font-bold">Default Harness</p>
            <p className="text-xs text-text-muted">
              Code execution harness for sandboxed agents
            </p>
          </div>
          <select
            value={defaultHarness}
            onChange={(e) => setDefaultHarness(e.target.value)}
            disabled={!sandboxedIsolation}
            className={cn(
              "px-4 py-2 bg-background-dark/50 border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              !sandboxedIsolation && "opacity-50 cursor-not-allowed"
            )}
          >
            {HARNESS_OPTIONS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        {/* Default Workspace Template */}
        <div className="flex items-center justify-between py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-bold">Default Workspace Template</p>
            <p className="text-xs text-text-muted">
              Container template for new sandboxed sessions
            </p>
          </div>
          <select
            value={defaultTemplate}
            onChange={(e) => setDefaultTemplate(e.target.value)}
            disabled={!sandboxedIsolation}
            className={cn(
              "px-4 py-2 bg-background-dark/50 border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              !sandboxedIsolation && "opacity-50 cursor-not-allowed"
            )}
          >
            {TEMPLATE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Template descriptions when isolation is on */}
        {sandboxedIsolation && (
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATE_OPTIONS.map((t) => (
              <div
                key={t.value}
                className={cn(
                  "p-3 rounded-lg border text-xs transition-all",
                  defaultTemplate === t.value
                    ? "border-primary/40 bg-primary/5"
                    : "border-border-dark/50 bg-background-dark/30"
                )}
              >
                <p className="font-bold">{t.label}</p>
                <p className="text-text-muted mt-0.5">{t.desc}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Library Management (sandboxed.sh) ─────────────────────────── */}
      {sandboxedAvailable && (
        <section className="glass-panel rounded-xl p-8 space-y-6">
          <SectionHeader
            icon="local_library"
            title="Library"
            description="Manage skills, commands, agents, and workspace templates in the sandboxed.sh library."
          />

          {/* Git status + sync */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-dark/30 border border-border-dark/50">
            <div className="flex items-center gap-3">
              <span className="icon text-primary">folder_managed</span>
              <div className="text-xs">
                {libraryStatus ? (
                  <>
                    <span className="font-bold">
                      {libraryStatus.branch ?? "unknown"}
                    </span>
                    <span className="text-text-muted ml-2">
                      {libraryStatus.clean ? "Clean" : "Uncommitted changes"}
                    </span>
                    {libraryStatus.remote && (
                      <span className="text-text-muted ml-2 font-mono text-[10px]">
                        {libraryStatus.remote}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-text-muted">Loading status...</span>
                )}
              </div>
            </div>
            <button
              onClick={() => librarySync.mutate()}
              disabled={librarySync.isPending}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
            >
              <span className={cn("icon text-sm", librarySync.isPending && "animate-spin")}>
                {librarySync.isPending ? "progress_activity" : "sync"}
              </span>
              Sync
            </button>
          </div>

          {/* Library tabs */}
          <div className="flex gap-1 bg-background-dark/40 rounded-lg p-1">
            {(
              [
                { value: "skill", label: "Skills", icon: "auto_fix_high" },
                { value: "command", label: "Commands", icon: "terminal" },
                { value: "agent", label: "Agents", icon: "smart_toy" },
                { value: "workspace-template", label: "Templates", icon: "content_copy" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setLibraryTab(tab.value); setLibraryEditItem(null); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all",
                  libraryTab === tab.value
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-text-muted hover:text-white"
                )}
              >
                <span className="icon text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Item list */}
          {libraryEditItem ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold font-mono">{libraryEditItem.name}</p>
                <button
                  onClick={() => setLibraryEditItem(null)}
                  className="text-xs text-text-muted hover:text-white transition-colors"
                >
                  Back to list
                </button>
              </div>
              <textarea
                value={libraryEditItem.content}
                onChange={(e) =>
                  setLibraryEditItem({ ...libraryEditItem, content: e.target.value })
                }
                className="w-full h-64 px-4 py-3 bg-background-dark/50 border border-primary/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setLibraryEditItem(null)}
                  className="px-4 py-2 text-xs font-bold text-text-muted hover:text-white rounded-lg border border-border-dark hover:border-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    librarySave.mutate({
                      name: libraryEditItem.name,
                      content: libraryEditItem.content,
                    })
                  }
                  disabled={librarySave.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-primary text-background-dark rounded-lg hover:bg-primary/90 transition-all"
                >
                  <span className="icon text-sm">save</span>
                  Save
                </button>
              </div>
            </div>
          ) : libraryItems.length > 0 ? (
            <div className="space-y-1.5">
              {libraryItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-dark/30 transition-colors group"
                >
                  <span className="icon text-sm text-primary">description</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold font-mono truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-[10px] text-text-muted truncate">{item.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={async () => {
                        try {
                          const { data } = await api.get(
                            `/sandbox/library/${libraryTab}/${item.name}`
                          );
                          setLibraryEditItem({
                            name: item.name,
                            content: typeof data === "string" ? data : data.content ?? JSON.stringify(data, null, 2),
                          });
                        } catch {
                          setToast({ message: "Failed to load item", type: "error" });
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-all"
                      title="Edit"
                    >
                      <span className="icon text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => libraryDelete.mutate(item.name)}
                      disabled={libraryDelete.isPending}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-all"
                      title="Delete"
                    >
                      <span className="icon text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="icon text-4xl text-text-muted">inventory_2</span>
              <p className="text-sm text-text-muted mt-2">
                No {libraryTab === "workspace-template" ? "templates" : `${libraryTab}s`} in library
              </p>
            </div>
          )}
        </section>
      )}

      {/* Save general + isolation button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveGeneral}
          disabled={saveGeneral.isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-black px-6 py-3 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {saveGeneral.isPending ? (
            <>
              <span className="icon text-sm animate-spin">
                progress_activity
              </span>
              Saving...
            </>
          ) : (
            <>
              <span className="icon text-sm">save</span>
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* ── Guardrails ───────────────────────────────────────────────────── */}
      <section className="glass-panel rounded-xl p-8 space-y-6">
        <SectionHeader
          icon="shield"
          title="Guardrails"
          description="Safety controls and audit policies for agent operations."
        />

        {/* Human Approval Required */}
        <div className="flex items-center justify-between py-3 border-b border-border-dark/50">
          <div className="space-y-0.5">
            <p className="text-sm font-bold">Human Approval Required</p>
            <p className="text-xs text-text-muted">
              Require human review before agents execute sensitive actions
            </p>
          </div>
          <Toggle checked={humanApproval} onChange={setHumanApproval} />
        </div>

        {/* Audit Log Persistence */}
        <div className="flex items-center justify-between py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-bold">Audit Log Persistence</p>
            <p className="text-xs text-text-muted">
              Persist all agent actions and tool calls to the audit log
            </p>
          </div>
          <Toggle checked={auditLog} onChange={setAuditLog} />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveGuardrails}
            disabled={saveGuardrails.isPending}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-black px-6 py-3 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {saveGuardrails.isPending ? (
              <>
                <span className="icon text-sm animate-spin">
                  progress_activity
                </span>
                Saving...
              </>
            ) : (
              <>
                <span className="icon text-sm">save</span>
                Save Guardrails
              </>
            )}
          </button>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
