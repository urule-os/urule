/**
 * Built-in widget component registry.
 * Maps componentPath values from manifests to lazy-loaded React components.
 */
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type WidgetComponent = ComponentType<Record<string, unknown>>;

/**
 * Map from manifest componentPath → dynamically imported widget component.
 * Using next/dynamic for code-splitting.
 */
export const BUILTIN_COMPONENTS: Record<string, WidgetComponent> = {
  "approval-queue": dynamic(() => import("./ApprovalQueueWidget"), { ssr: false }) as unknown as WidgetComponent,
  "sandbox-monitor": dynamic(() => import("./SandboxMonitorWidget"), { ssr: false }) as unknown as WidgetComponent,
  "sandbox-terminal": dynamic(() => import("./SandboxTerminalWidget"), { ssr: false }) as unknown as WidgetComponent,
  "sandbox-desktop": dynamic(() => import("./SandboxDesktopWidget"), { ssr: false }) as unknown as WidgetComponent,
  "dashboard-stats": dynamic(() => import("./DashboardStatsWidget"), { ssr: false }) as unknown as WidgetComponent,
  "activity-logs": dynamic(() => import("./ActivityLogsWidget"), { ssr: false }) as unknown as WidgetComponent,
  "integrations": dynamic(() => import("./IntegrationsWidget"), { ssr: false }) as unknown as WidgetComponent,
  "projects": dynamic(() => import("./ProjectsWidget"), { ssr: false }) as unknown as WidgetComponent,
};
