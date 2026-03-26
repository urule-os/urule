"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Agent, AgentStatus, ActivityLog } from "@/types";

// ── Status dot styles ────────────────────────────────────────────────────────

const STATUS_DOT: Record<AgentStatus, string> = {
  active: "bg-green-500",
  thinking: "bg-yellow-500 animate-pulse",
  idle: "bg-amber-400",
  offline: "bg-slate-500",
  busy: "bg-indigo-400",
  deployable: "bg-primary",
};

// ── Sub-components ───────────────────────────────────────────────────────────

function OfficeAvatar({ agent, showBubble = true }: { agent: Agent; showBubble?: boolean }) {
  const accent = agent.accent_color ?? "#0db9f2";
  const dot = STATUS_DOT[agent.status] ?? "bg-slate-500";
  const isWorking = agent.status === "active" || agent.status === "thinking" || agent.status === "busy";

  return (
    <Link href={`/office/agents/${agent.id}`} className="flex flex-col items-center group">
      {showBubble && isWorking && (
        <div
          className="bg-white/90 backdrop-blur px-2 py-1 rounded shadow-lg mb-2 whitespace-nowrap max-w-[160px]"
          style={{ borderLeft: `2px solid ${accent}` }}
        >
          <p className="text-[9px] font-bold text-background-dark flex items-center gap-1 truncate">
            {agent.status === "thinking" && <span className="icon text-[10px] animate-spin shrink-0">sync</span>}
            {agent.status === "active" && <span className="icon text-[10px] shrink-0">play_arrow</span>}
            {agent.status === "busy" && <span className="icon text-[10px] shrink-0">pending</span>}
            {agent.role ?? (agent.status === "thinking" ? "Thinking..." : "Processing...")}
          </p>
        </div>
      )}
      <div
        className="bg-background-dark/80 text-white px-1.5 py-0.5 rounded text-[8px] font-bold mb-1 border whitespace-nowrap"
        style={{ borderColor: `${accent}50` }}
      >
        {agent.name}
      </div>
      <div className="relative">
        <div
          className="size-9 rounded-lg flex items-center justify-center border-2 shadow-lg group-hover:scale-110 transition-transform"
          style={{ background: accent, borderColor: `${accent}cc` }}
        >
          <span className="icon text-white text-base">smart_toy</span>
        </div>
        <span className={cn("absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-[#1a2c33]", dot)} />
      </div>
    </Link>
  );
}

function HumanAvatar({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-background-dark/80 text-white px-1.5 py-0.5 rounded text-[8px] font-bold mb-1 border border-slate-400/50 whitespace-nowrap">
        {name}
      </div>
      <div className="size-8 bg-slate-300 rounded-full flex items-center justify-center border-2 border-white shadow-md">
        <span className="icon text-slate-600 text-sm">person</span>
      </div>
    </div>
  );
}

function Desk({ empty = false }: { empty?: boolean }) {
  return (
    <div className={cn("w-12 h-8 bg-slate-700 rounded border-b-4 border-slate-900 mx-auto", empty && "opacity-30")} />
  );
}

function ServerRack() {
  return (
    <div className="w-32 h-16 bg-slate-800 rounded-lg border-2 border-slate-700 flex items-center justify-center">
      <div className="w-24 h-8 bg-primary/20 rounded flex items-center justify-center gap-1">
        <div className="w-1 h-4 bg-primary animate-bounce" />
        <div className="w-1 h-6 bg-primary animate-bounce [animation-delay:100ms]" />
        <div className="w-1 h-3 bg-primary animate-bounce [animation-delay:200ms]" />
      </div>
    </div>
  );
}

function MeetingTable() {
  return <div className="w-64 h-16 bg-[#3d2b1f] rounded-full border-b-8 border-[#261b14]" />;
}

// ── Main component ───────────────────────────────────────────────────────────

interface OfficeViewProps {
  agents: Agent[];
  logs: ActivityLog[];
  userName?: string;
  onBack: () => void;
}

export function OfficeView({ agents, logs, userName, onBack }: OfficeViewProps) {
  const { engineering, boardroom, marketing, coffeeBreak } = useMemo(() => {
    const engineering: Agent[] = [];
    const boardroom: Agent[] = [];
    const marketing: Agent[] = [];
    const coffeeBreak: Agent[] = [];

    for (const agent of agents) {
      if (agent.status === "deployable") continue;
      if (agent.status === "offline") {
        coffeeBreak.push(agent);
        continue;
      }
      const div = (agent.category ?? "").toLowerCase();
      if (div === "engineering" || div === "testing") engineering.push(agent);
      else if (div === "marketing" || div === "design") marketing.push(agent);
      else if (div === "support") coffeeBreak.push(agent);
      else boardroom.push(agent);
    }
    return { engineering, boardroom, marketing, coffeeBreak };
  }, [agents]);

  const onlineCount = agents.filter((a) => a.status !== "offline" && a.status !== "deployable").length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left Sidebar ──────────────────────────────────────────── */}
      <aside className="w-72 border-r border-primary/20 bg-background-dark/50 backdrop-blur-md flex flex-col shrink-0 z-10">
        {/* Back + header */}
        <div className="p-4 border-b border-primary/10 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors"
          >
            <span className="icon text-sm">arrow_back</span>
            Dashboard
          </button>
          <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
            {onlineCount} ONLINE
          </span>
        </div>

        {/* Active agents */}
        <div className="p-4 border-b border-primary/10">
          <h3 className="font-bold text-[11px] uppercase tracking-wider text-text-muted mb-3">Active Agents</h3>
          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
            {agents
              .filter((a) => a.status !== "deployable")
              .sort((a, b) => {
                const order: Record<string, number> = { active: 0, thinking: 1, busy: 2, idle: 3, offline: 4 };
                return (order[a.status] ?? 5) - (order[b.status] ?? 5);
              })
              .map((agent) => {
                const accent = agent.accent_color ?? "#0db9f2";
                const dot = STATUS_DOT[agent.status] ?? "bg-slate-500";
                const isActive = agent.status === "active" || agent.status === "thinking";
                return (
                  <Link
                    key={agent.id}
                    href={`/office/agents/${agent.id}`}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-colors",
                      isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-primary/5"
                    )}
                  >
                    <div className="relative">
                      <div
                        className="size-10 rounded flex items-center justify-center text-white"
                        style={{ background: accent }}
                      >
                        <span className="icon text-sm">smart_toy</span>
                      </div>
                      <span
                        className={cn(
                          "absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-background-dark",
                          dot
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{agent.name}</p>
                      <p className="text-[10px] text-text-muted truncate">
                        {agent.category ?? agent.role ?? agent.status}
                      </p>
                    </div>
                    {isActive && <span className="icon text-primary text-sm">terminal</span>}
                    {agent.status === "thinking" && (
                      <span className="icon text-yellow-400 text-sm">settings_slow_motion</span>
                    )}
                  </Link>
                );
              })}
            {agents.length === 0 && (
              <p className="text-xs text-text-muted text-center py-6">No agents deployed</p>
            )}
          </div>
        </div>

        {/* Live Feed */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-bold text-[11px] uppercase tracking-wider text-text-muted mb-3">Live Feed</h3>
          <div className="space-y-3 text-xs">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex gap-2">
                <div
                  className={cn(
                    "w-1 shrink-0 rounded-full self-stretch min-h-[1rem]",
                    log.event_type === "success" && "bg-primary/30",
                    log.event_type === "critical" && "bg-rose-500/30",
                    log.event_type === "warning" && "bg-amber-500/30",
                    log.event_type === "modification" && "bg-blue-500/30",
                    log.event_type === "integration" && "bg-purple-500/30",
                    log.event_type === "info" && "bg-slate-500/30"
                  )}
                />
                <p className="text-text-muted leading-relaxed">{log.title}</p>
              </div>
            ))}
            {logs.length === 0 && <p className="text-text-muted text-center py-4">No recent activity</p>}
          </div>
        </div>

        {/* CTA */}
        <div className="p-4 border-t border-primary/10 bg-primary/5">
          <Link
            href="/office/agents/new"
            className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span className="icon text-lg">person_add</span>
            Invite Agent
          </Link>
        </div>
      </aside>

      {/* ── Main Canvas + Status Bar ──────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main
          className="flex-1 relative overflow-auto"
          style={{
            background: "#1a2c33",
            backgroundSize: "40px 40px",
            backgroundImage:
              "linear-gradient(to right, rgba(13,185,242,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(13,185,242,0.05) 1px, transparent 1px)",
          }}
        >
          <div className="relative" style={{ minWidth: 1100, minHeight: 720, padding: 40 }}>
            {/* ── Engineering Lab (top-left) ────────────────────── */}
            <div
              className="absolute top-10 left-10 border-2 border-primary/20 bg-primary/5 rounded-xl p-4"
              style={{ width: 420, minHeight: 260 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="icon text-primary">developer_board</span>
                <h4 className="font-bold text-primary tracking-widest text-xs uppercase">Engineering Lab</h4>
              </div>
              <div className="flex flex-wrap gap-6 items-end">
                {engineering.map((agent) => (
                  <div key={agent.id} className="flex flex-col items-center gap-2">
                    <OfficeAvatar agent={agent} />
                    <Desk />
                  </div>
                ))}
                {engineering.length === 0 && (
                  <div className="flex gap-6">
                    <Desk empty />
                    <Desk empty />
                    <Desk empty />
                  </div>
                )}
              </div>
              {engineering.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <ServerRack />
                </div>
              )}
            </div>

            {/* ── The Boardroom (top-right) ─────────────────────── */}
            <div
              className="absolute top-10 right-10 border-2 border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4"
              style={{ width: 500, minHeight: 240 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="icon text-yellow-400">groups</span>
                <h4 className="font-bold text-yellow-400 tracking-widest text-xs uppercase">The Boardroom</h4>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex flex-wrap justify-center gap-4 -mt-2 mb-4">
                  {boardroom.map((agent) => (
                    <OfficeAvatar key={agent.id} agent={agent} />
                  ))}
                  {userName && <HumanAvatar name={userName} />}
                  {boardroom.length === 0 && !userName && (
                    <p className="text-xs text-text-muted/40 italic py-4">Waiting for meeting...</p>
                  )}
                </div>
                <MeetingTable />
                <div className="mt-4 flex gap-2">
                  <span className="icon text-yellow-500/40 animate-pulse">settings</span>
                  <span className="icon text-yellow-500/40 animate-pulse [animation-delay:500ms]">settings</span>
                </div>
              </div>
            </div>

            {/* ── Marketing Lounge (bottom-left) ────────────────── */}
            <div
              className="absolute bottom-16 left-10 border-2 border-purple-500/20 bg-purple-500/5 rounded-xl p-4"
              style={{ width: 420, minHeight: 200 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="icon text-purple-400">auto_awesome</span>
                <h4 className="font-bold text-purple-400 tracking-widest text-xs uppercase">Marketing Lounge</h4>
              </div>
              <div className="flex flex-wrap items-end gap-6 justify-center">
                {marketing.map((agent) => (
                  <OfficeAvatar key={agent.id} agent={agent} />
                ))}
                {marketing.length > 0 && (
                  <div className="w-16 h-12 bg-purple-900/40 rounded-xl border-b-4 border-purple-950 flex items-center justify-center">
                    <div className="w-10 h-6 bg-purple-800 rounded" />
                  </div>
                )}
                {marketing.length === 0 && (
                  <p className="text-xs text-text-muted/40 italic py-6">Quiet today...</p>
                )}
              </div>
            </div>

            {/* ── Coffee Break (bottom-right) ───────────────────── */}
            <div
              className="absolute bottom-16 right-10 border-2 border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4"
              style={{ width: 280, minHeight: 200 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="icon text-emerald-400">coffee</span>
                <h4 className="font-bold text-emerald-400 tracking-widest text-xs uppercase">Coffee Break</h4>
              </div>
              <div className="flex flex-wrap gap-4 items-end">
                {/* Coffee machine */}
                <div className="w-12 h-20 bg-slate-800 rounded border-2 border-slate-700 flex flex-col items-center pt-2">
                  <div className="size-4 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="mt-auto w-full h-4 bg-slate-900 rounded-b" />
                </div>
                {coffeeBreak.map((agent) => (
                  <div key={agent.id} className="flex flex-col items-center gap-1">
                    <OfficeAvatar agent={agent} showBubble={false} />
                  </div>
                ))}
                {coffeeBreak.length === 0 && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-white px-1 rounded text-[8px] font-bold text-background-dark">Zzz...</div>
                    <div className="size-8 bg-slate-600 rounded flex items-center justify-center border-2 border-slate-500">
                      <span className="icon text-white text-sm">bedtime</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Controls overlay ──────────────────────────────────── */}
          <div className="sticky bottom-6 flex justify-center pointer-events-none pb-4">
            <div className="inline-flex items-center gap-4 bg-background-dark/80 backdrop-blur-lg px-6 py-3 rounded-2xl border border-primary/30 shadow-2xl pointer-events-auto">
              <button className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors flex flex-col items-center gap-1">
                <span className="icon">zoom_in</span>
                <span className="text-[10px] font-bold">ZOOM</span>
              </button>
              <div className="h-8 w-px bg-primary/20" />
              <button className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors flex flex-col items-center gap-1">
                <span className="icon">videocam</span>
                <span className="text-[10px] font-bold">JOIN</span>
              </button>
              <div className="h-8 w-px bg-primary/20" />
              <button className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors flex flex-col items-center gap-1">
                <span className="icon">map</span>
                <span className="text-[10px] font-bold">AUTO</span>
              </button>
            </div>
          </div>

          {/* ── Minimap ──────────────────────────────────────────── */}
          <div className="fixed bottom-14 right-8 w-40 h-32 bg-background-dark/90 rounded-xl border-2 border-primary/40 overflow-hidden shadow-2xl z-20">
            <div className="relative w-full h-full p-2">
              <div className="absolute top-2 left-2 w-10 h-8 bg-primary/30 rounded-sm" />
              <div className="absolute top-2 right-2 w-14 h-6 bg-yellow-500/30 rounded-sm" />
              <div className="absolute bottom-6 left-2 w-10 h-6 bg-purple-500/30 rounded-sm" />
              <div className="absolute bottom-6 right-2 w-7 h-6 bg-emerald-500/30 rounded-sm" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-2 bg-white rounded-full animate-ping" />
            </div>
            <div className="absolute bottom-0 w-full bg-primary/20 py-1 text-center">
              <span className="text-[8px] font-bold text-primary tracking-tighter">FLOOR 01-A</span>
            </div>
          </div>
        </main>

        {/* ── Status Bar ─────────────────────────────────────────── */}
        <footer className="h-8 bg-primary text-background-dark px-4 flex items-center justify-between text-[10px] font-bold shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="icon text-xs">memory</span> CPU:{" "}
              {Math.min(agents.filter((a) => a.status === "active").length * 8 + 4, 100)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="icon text-xs">database</span> LATENCY: 24ms
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="icon text-xs">public</span> WORLD: SELF-HOSTED
            </span>
            <span>
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} UTC
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
