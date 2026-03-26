"use client";

import { useEffect, useRef, useCallback } from "react";
import type { WidgetRenderContext } from "./context";

interface WidgetFrameProps {
  context: WidgetRenderContext;
  entryUrl: string;
}

/**
 * Iframe wrapper for external widgets.
 * Sends init/theme/config messages via postMessage.
 */
export function WidgetFrame({ context, entryUrl }: WidgetFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendMessage = useCallback(
    (type: string, payload: unknown) => {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type,
          widgetId: context.widgetId,
          payload,
          timestamp: Date.now(),
        },
        "*"
      );
    },
    [context.widgetId]
  );

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.widgetId !== context.widgetId) return;

      switch (data.type) {
        case "widget:ready":
          sendMessage("widget:init", {
            widgetId: context.widgetId,
            manifestId: context.manifestId,
            workspaceId: context.workspaceId,
            config: context.config,
            theme: context.theme,
            permissions: context.permissions,
          });
          break;
        case "widget:resize":
          // Could resize the iframe container if needed
          break;
        case "widget:action":
          // Forward to parent or handle action
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [context, sendMessage]);

  return (
    <iframe
      ref={iframeRef}
      src={entryUrl}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms"
      title={context.manifestId}
    />
  );
}
