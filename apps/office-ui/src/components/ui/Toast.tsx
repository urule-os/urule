"use client";

import { useEffect } from "react";
import { useToastStore, type Toast } from "@/store/useToastStore";

const ICON_MAP: Record<Toast["type"], string> = {
  success: "check_circle",
  error: "error",
  warning: "warning",
  info: "info",
};

const COLOR_MAP: Record<Toast["type"], { border: string; icon: string; bg: string }> = {
  success: {
    border: "border-accent-success/40",
    icon: "text-accent-success",
    bg: "bg-accent-success/10",
  },
  error: {
    border: "border-accent-warning/40",
    icon: "text-accent-warning",
    bg: "bg-accent-warning/10",
  },
  warning: {
    border: "border-yellow-500/40",
    icon: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  info: {
    border: "border-primary/40",
    icon: "text-primary",
    bg: "bg-primary/10",
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const duration = toast.duration ?? 5000;
  const colors = COLOR_MAP[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, removeToast]);

  return (
    <div
      className={`flex items-start gap-3 w-80 p-4 rounded-xl border ${colors.border} ${colors.bg} bg-surface-dark/95 backdrop-blur-xl shadow-lg shadow-black/30 animate-slide-in-right`}
      role="alert"
    >
      <span className={`icon text-xl shrink-0 mt-0.5 ${colors.icon}`}>
        {ICON_MAP[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-text-muted mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-text-muted hover:text-white transition-colors shrink-0"
      >
        <span className="icon text-lg">close</span>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
