"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Desktop streaming viewer — connects to sandboxed.sh's MJPEG WebSocket.
 * Receives JPEG frames as binary ArrayBuffers and draws them to a canvas.
 * Sends mouse/keyboard input commands back over the same WebSocket.
 */
export default function SandboxDesktop({
  display = ":99",
  initialFps = 10,
  initialQuality = 70,
}: {
  display?: string;
  initialFps?: number;
  initialQuality?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { access_token: accessToken } = useAuthStore();

  const [fps, setFps] = useState(initialFps);
  const [quality, setQuality] = useState(initialQuality);
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!accessToken) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? "localhost:8000";
    const url = `${protocol}//${host}/api/v1/sandbox/desktop/stream?token=${accessToken}&display=${display}&fps=${fps}&quality=${quality}`;

    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // JPEG frame — draw to canvas
        const blob = new Blob([event.data], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          if (canvas.width !== img.width || canvas.height !== img.height) {
            canvas.width = img.width;
            canvas.height = img.height;
          }
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } else if (typeof event.data === "string") {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            setError(msg.message || msg.error);
          }
        } catch {}
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setError("Connection error");
      setConnected(false);
    };
  }, [accessToken, display, fps, quality]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  // Send control command
  const sendCmd = useCallback((cmd: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  }, []);

  // Mouse handlers relative to canvas
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    sendCmd({ t: "click", x, y, button: 1 });
  };

  const handleScroll = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e as unknown as React.MouseEvent<HTMLCanvasElement>);
    sendCmd({ t: "scroll", delta_y: e.deltaY, x, y });
  };

  const handleTogglePause = () => {
    if (paused) {
      sendCmd({ t: "resume" });
    } else {
      sendCmd({ t: "pause" });
    }
    setPaused(!paused);
  };

  const handleFpsChange = (newFps: number) => {
    setFps(newFps);
    sendCmd({ t: "fps", fps: newFps });
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    sendCmd({ t: "quality", quality: newQuality });
  };

  const handleFullscreen = () => {
    canvasRef.current?.requestFullscreen();
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="icon text-primary">desktop_windows</span>
          <span className="font-bold text-sm">Desktop View</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest`}>
            <span className={`size-2 rounded-full ${connected ? "bg-accent-success animate-pulse" : "bg-slate-500"}`} />
            {connected ? "Live" : "Disconnected"}
          </span>
          {error && <span className="text-[10px] text-accent-warning">{error}</span>}
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-black relative">
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted">
            <div className="text-center">
              <span className="icon text-4xl block mb-2">desktop_access_disabled</span>
              <p className="text-sm">No desktop stream</p>
              <button
                onClick={connect}
                className="mt-2 px-3 py-1 bg-primary/10 text-primary text-xs rounded-lg hover:bg-primary/20 transition-colors"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          style={{ minHeight: 300, maxHeight: 600 }}
          onClick={handleClick}
          onWheel={handleScroll}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 p-3 bg-surface-dark/50 border-t border-white/5">
        <button
          onClick={handleTogglePause}
          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
          title={paused ? "Resume" : "Pause"}
        >
          <span className="icon text-sm text-primary">{paused ? "play_arrow" : "pause"}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted">FPS</span>
          <input
            type="range"
            min={1}
            max={30}
            value={fps}
            onChange={(e) => handleFpsChange(Number(e.target.value))}
            className="w-20 h-1 accent-primary"
          />
          <span className="text-[10px] font-mono text-primary w-6">{fps}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted">Quality</span>
          <input
            type="range"
            min={10}
            max={100}
            step={10}
            value={quality}
            onChange={(e) => handleQualityChange(Number(e.target.value))}
            className="w-20 h-1 accent-primary"
          />
          <span className="text-[10px] font-mono text-primary w-8">{quality}%</span>
        </div>

        <div className="ml-auto">
          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            title="Fullscreen"
          >
            <span className="icon text-sm text-text-muted">fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
