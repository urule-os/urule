"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface UseWebSocketOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMessage?: (event: any) => void;
  reconnectDelay?: number;
}

export function useWebSocket(
  conversationId: string | null,
  { onMessage, reconnectDelay = 3000 }: UseWebSocketOptions = {}
) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);
  const { access_token } = useAuthStore();

  const connect = useCallback(() => {
    if (!conversationId || !access_token) return;

    const adapterUrl = process.env.NEXT_PUBLIC_ADAPTER_URL ?? "http://localhost:3002";
    const adapterHost = adapterUrl.replace(/^https?:\/\//, "");
    const wsProtocol = adapterUrl.startsWith("https") ? "wss" : "ws";
    const wsUrl = `${wsProtocol}://${adapterHost}/api/v1/ws/conversations/${conversationId}?token=${access_token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current) setConnected(true);
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessage?.(data);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      // Reconnect with exponential-ish backoff
      reconnectTimer.current = setTimeout(connect, reconnectDelay);
    };

    ws.onerror = () => ws.close();
  }, [conversationId, access_token, onMessage, reconnectDelay]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}
