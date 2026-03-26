"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface SystemMetrics {
  cpu_percent: number;
  cpu_cores: number[];
  memory_used: number;
  memory_total: number;
  memory_percent: number;
  network_rx_bytes_per_sec: number;
  network_tx_bytes_per_sec: number;
  timestamp_ms: number;
}

interface ContainerMetrics {
  workspace_id: string;
  workspace_name: string;
  cpu_percent: number;
  memory_used: number;
  memory_total: number;
  memory_percent: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const MAX_HISTORY = 60;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}

function formatMemMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

/** Renders an SVG sparkline from a numeric array. */
function Sparkline({
  data,
  max,
  color = "#0db9f2",
  height = 28,
  width = 120,
}: {
  data: number[];
  max?: number;
  color?: string;
  height?: number;
  width?: number;
}) {
  if (data.length < 2) return null;
  const peak = max ?? Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / peak) * height;
    return `${x},${y}`;
  });
  const pathD = `M${points.join(" L")}`;
  const areaD = `${pathD} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} className="block">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sg-${color.replace("#", "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SandboxMonitor() {
  const { access_token: accessToken } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [history, setHistory] = useState<SystemMetrics[]>([]);
  const [containers, setContainers] = useState<ContainerMetrics[]>([]);

  const connect = useCallback(() => {
    if (!accessToken) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host =
      process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ??
      "localhost:8000";
    const url = `${protocol}//${host}/api/v1/sandbox/monitor?token=${accessToken}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "history") {
          // Initial history buffer
          setHistory(msg.history?.slice(-MAX_HISTORY) ?? []);
          return;
        }

        if (msg.type === "container_metrics") {
          setContainers(msg.containers ?? []);
          return;
        }

        // Regular system metrics tick
        if (msg.cpu_percent !== undefined) {
          setHistory((prev) => {
            const next = [...prev, msg as SystemMetrics];
            return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
          });
        }
      } catch {
        // ignore non-JSON
      }
    };

    return () => {
      ws.close();
    };
  }, [accessToken]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      wsRef.current?.close();
    };
  }, [connect]);

  const togglePause = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const next = !paused;
    ws.send(JSON.stringify({ t: next ? "pause" : "resume" }));
    setPaused(next);
  };

  const latest = history[history.length - 1];
  if (!connected || !latest) return null;

  const cpuHistory = history.map((m) => m.cpu_percent);
  const memHistory = history.map((m) => m.memory_percent);
  const rxHistory = history.map((m) => m.network_rx_bytes_per_sec);
  const txHistory = history.map((m) => m.network_tx_bytes_per_sec);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="icon text-primary">speed</span>
            <span className="font-bold text-sm">Real-time Monitoring</span>
            <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-accent-success">
              <span className="size-1.5 rounded-full bg-accent-success animate-pulse" />
              Live
            </span>
          </div>
          <button
            onClick={togglePause}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              paused ? "bg-amber-500/10 text-amber-400" : "hover:bg-surface-dark text-text-muted"
            )}
            title={paused ? "Resume" : "Pause"}
          >
            <span className="icon text-sm">{paused ? "play_arrow" : "pause"}</span>
          </button>
        </div>

        {/* Main metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* CPU */}
          <div className="bg-background-dark/40 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-text-muted uppercase tracking-wider">CPU</p>
              <p className="text-sm font-black font-mono text-primary">
                {latest.cpu_percent.toFixed(1)}%
              </p>
            </div>
            <Sparkline data={cpuHistory} max={100} color="#0db9f2" />
          </div>

          {/* Memory */}
          <div className="bg-background-dark/40 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-text-muted uppercase tracking-wider">Memory</p>
              <p className="text-sm font-black font-mono text-purple-400">
                {latest.memory_percent.toFixed(1)}%
              </p>
            </div>
            <Sparkline data={memHistory} max={100} color="#b070d0" />
            <div className="flex justify-between text-[9px] text-text-muted">
              <span>{formatMemMB(latest.memory_used)}</span>
              <span>{formatMemMB(latest.memory_total)}</span>
            </div>
          </div>

          {/* Network RX */}
          <div className="bg-background-dark/40 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-text-muted uppercase tracking-wider">Net RX</p>
              <p className="text-xs font-bold font-mono text-accent-success">
                {formatBytes(latest.network_rx_bytes_per_sec)}/s
              </p>
            </div>
            <Sparkline data={rxHistory} color="#0bda57" />
          </div>

          {/* Network TX */}
          <div className="bg-background-dark/40 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-text-muted uppercase tracking-wider">Net TX</p>
              <p className="text-xs font-bold font-mono text-amber-400">
                {formatBytes(latest.network_tx_bytes_per_sec)}/s
              </p>
            </div>
            <Sparkline data={txHistory} color="#f0c040" />
          </div>
        </div>
      </div>

      {/* Per-core CPU (collapsible) */}
      {latest.cpu_cores && latest.cpu_cores.length > 0 && (
        <details className="glass-panel rounded-xl overflow-hidden">
          <summary className="p-4 cursor-pointer flex items-center gap-2 hover:bg-surface-dark/30 transition-colors">
            <span className="icon text-sm text-primary">memory</span>
            <span className="text-xs font-bold">CPU Cores ({latest.cpu_cores.length})</span>
          </summary>
          <div className="px-4 pb-4 grid grid-cols-2 gap-2">
            {latest.cpu_cores.map((pct, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] text-text-muted w-5">#{i}</span>
                <div className="flex-1 h-1.5 bg-background-dark rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pct > 80 ? "bg-rose-400" : pct > 50 ? "bg-amber-400" : "bg-primary"
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono w-8 text-right">{pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Per-workspace containers */}
      {containers.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="icon text-sm text-primary">deployed_code</span>
            <span className="text-xs font-bold">Workspace Containers</span>
          </div>
          <div className="space-y-2">
            {containers.map((c) => (
              <div key={c.workspace_id} className="bg-background-dark/40 rounded-lg p-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold truncate">{c.workspace_name || c.workspace_id}</p>
                </div>
                <div className="flex gap-3 text-[9px] font-mono shrink-0">
                  <span className="text-primary">{c.cpu_percent.toFixed(1)}%</span>
                  <span className="text-purple-400">
                    {formatMemMB(c.memory_used)}/{formatMemMB(c.memory_total)}
                  </span>
                </div>
                <div className="w-16 h-1.5 bg-surface-dark rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      c.memory_percent > 80 ? "bg-rose-400" : "bg-primary"
                    )}
                    style={{ width: `${Math.min(c.memory_percent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
