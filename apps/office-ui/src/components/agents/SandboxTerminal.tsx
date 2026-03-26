"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * WebSocket PTY terminal that connects to a sandboxed.sh workspace shell
 * via the Urule proxy at /api/v1/sandbox/console/{workspaceId}.
 *
 * Uses xterm.js for rendering. Dynamically imported to avoid SSR issues.
 */
export default function SandboxTerminal({ workspaceId }: { workspaceId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitRef = useRef<any>(null);
  const { access_token: accessToken } = useAuthStore();

  const connect = useCallback(async () => {
    if (!containerRef.current || !accessToken) return;

    // Dynamic import to avoid SSR
    const { Terminal } = await import("@xterm/xterm");
    const { FitAddon } = await import("@xterm/addon-fit");
    // @ts-expect-error CSS import handled by Next.js bundler
    await import("@xterm/xterm/css/xterm.css");

    // Clean up previous instance
    if (termRef.current) {
      termRef.current.dispose();
    }

    const term = new Terminal({
      theme: {
        background: "#101e22",
        foreground: "#90bccb",
        cursor: "#0db9f2",
        cursorAccent: "#101e22",
        selectionBackground: "#0db9f240",
        black: "#101e22",
        red: "#fa5f38",
        green: "#0bda57",
        yellow: "#f0c040",
        blue: "#0db9f2",
        magenta: "#b070d0",
        cyan: "#0db9f2",
        white: "#90bccb",
        brightBlack: "#315a68",
        brightRed: "#fa5f38",
        brightGreen: "#0bda57",
        brightYellow: "#f0c040",
        brightBlue: "#0db9f2",
        brightMagenta: "#b070d0",
        brightCyan: "#0db9f2",
        brightWhite: "#ffffff",
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    // WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? "localhost:8000";
    const url = `${protocol}//${host}/api/v1/sandbox/console/${workspaceId}?token=${accessToken}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln("\x1b[36m● Connected to sandbox workspace\x1b[0m\r\n");
      // Send initial resize
      const { cols, rows } = term;
      ws.send(JSON.stringify({ t: "r", c: cols, r: rows }));
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      term.writeln("\r\n\x1b[31m● Disconnected\x1b[0m");
    };

    ws.onerror = () => {
      term.writeln("\r\n\x1b[31m● Connection error\x1b[0m");
    };

    // Forward keystrokes
    term.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ t: "i", d: data }));
      }
    });

    // Forward resize
    term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ t: "r", c: cols, r: rows }));
      }
    });
  }, [workspaceId, accessToken]);

  useEffect(() => {
    connect();

    const handleResize = () => {
      fitRef.current?.fit();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, [connect]);

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="icon text-primary">terminal</span>
          <span className="font-bold text-sm">Sandbox Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest">
            <span className="size-2 rounded-full bg-accent-success animate-pulse" />
            Connected
          </span>
          <button
            onClick={() => {
              wsRef.current?.close();
              connect();
            }}
            className="p-1.5 rounded-lg hover:bg-surface-dark transition-colors"
            title="Reconnect"
          >
            <span className="icon text-sm text-text-muted">refresh</span>
          </button>
        </div>
      </div>
      <div className="bg-[#101e22]" style={{ height: 420 }}>
        <div ref={containerRef} className="h-full w-full p-2" />
      </div>
    </div>
  );
}
