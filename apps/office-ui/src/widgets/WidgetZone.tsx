"use client";

import { useWidgetStore } from "@/store/useWidgetStore";
import { widgetRegistry } from "./registry";
import { NativeWidgetRenderer } from "./NativeWidgetRenderer";
import { WidgetFrame } from "./WidgetFrame";
import type { WidgetRenderContext } from "./context";
import type { WidgetMountPoint, WidgetTheme } from "./types";
import { cn } from "@/lib/utils";

const DEFAULT_THEME: WidgetTheme = {
  mode: "dark",
  colors: {
    primary: "#0db9f2",
    background: "#101e22",
    surface: "#182d34",
    text: "#90bccb",
    textMuted: "#315a68",
    border: "rgba(255,255,255,0.05)",
    accent: { success: "#0bda57", warning: "#f0c040", error: "#fa5f38" },
  },
  fontFamily: "Inter, system-ui, sans-serif",
  monoFontFamily: "JetBrains Mono, monospace",
};

interface WidgetZoneProps {
  mountPoint: WidgetMountPoint;
  workspaceId: string;
  className?: string;
}

/**
 * Renders all active widget instances at a given mount point.
 * Native widgets render inline; external widgets render in iframes.
 */
export function WidgetZone({ mountPoint, workspaceId, className }: WidgetZoneProps) {
  const activeMainWidgetId = useWidgetStore((s) => s.activeMainWidgetId);
  const instances = widgetRegistry.getInstancesByMountPoint(workspaceId, mountPoint);

  if (instances.length === 0) return null;

  const layoutClass = getLayoutClass(mountPoint);

  return (
    <div className={cn(layoutClass, className)}>
      {instances.map((instance) => {
        const manifest = widgetRegistry.getManifest(instance.manifestId);
        if (!manifest) return null;

        // In main-panel, only render the active widget (tab behavior)
        if (mountPoint === "main-panel" && activeMainWidgetId && activeMainWidgetId !== instance.id) {
          return null;
        }

        const context: WidgetRenderContext = {
          widgetId: instance.id,
          manifestId: instance.manifestId,
          workspaceId: instance.workspaceId,
          mountPoint: instance.mountPoint,
          config: instance.config,
          theme: DEFAULT_THEME,
          permissions: manifest.permissions,
        };

        return (
          <div key={instance.id} className="widget-container">
            {manifest.entryType === "native" && manifest.componentPath ? (
              <NativeWidgetRenderer context={context} componentPath={manifest.componentPath} />
            ) : manifest.entryType === "external" && manifest.entryUrl ? (
              <WidgetFrame context={context} entryUrl={manifest.entryUrl} />
            ) : (
              <div className="p-4 text-accent-warning text-sm">
                <span className="icon mr-1">error</span>
                Invalid widget configuration for {manifest.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getLayoutClass(mountPoint: WidgetMountPoint): string {
  switch (mountPoint) {
    case "sidebar":
      return "flex flex-col gap-2";
    case "main-panel":
      return "flex-1 overflow-y-auto";
    case "drawer":
      return "flex flex-col gap-2";
    case "modal":
      return "fixed inset-0 z-50 flex items-center justify-center bg-black/50";
    case "status-bar":
      return "flex items-center gap-4";
    default:
      return "";
  }
}
