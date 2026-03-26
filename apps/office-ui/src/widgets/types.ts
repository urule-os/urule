/**
 * Local widget type definitions mirroring @urule/widget-sdk types.
 * We re-declare them here to avoid a build dependency on the SDK package
 * (which is a Node library, not a React/Next.js package).
 */

export type WidgetMountPoint = "sidebar" | "main-panel" | "modal" | "status-bar" | "drawer";
export type WidgetEntryType = "native" | "external";
export type WidgetCategory = "monitoring" | "productivity" | "communication" | "development" | "admin";

export interface WidgetManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  mountPoints: WidgetMountPoint[];
  entryType: WidgetEntryType;
  entryUrl?: string;
  componentPath?: string;
  permissions: string[];
  defaultConfig: Record<string, unknown>;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  icon?: string;
  category?: WidgetCategory;
}

export interface WidgetInstance {
  id: string;
  manifestId: string;
  workspaceId: string;
  mountPoint: WidgetMountPoint;
  position: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetTheme {
  mode: "dark" | "light";
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    accent: {
      success: string;
      warning: string;
      error: string;
    };
  };
  fontFamily: string;
  monoFontFamily: string;
}
