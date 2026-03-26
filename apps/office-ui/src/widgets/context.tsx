"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  WidgetMountPoint,
  WidgetTheme,
} from "./types";

export interface WidgetRenderContext {
  widgetId: string;
  manifestId: string;
  workspaceId: string;
  mountPoint: WidgetMountPoint;
  config: Record<string, unknown>;
  theme: WidgetTheme;
  permissions: string[];
}

const WidgetContext = createContext<WidgetRenderContext | null>(null);

export function WidgetProvider({
  value,
  children,
}: {
  value: WidgetRenderContext;
  children: ReactNode;
}) {
  return (
    <WidgetContext.Provider value={value}>{children}</WidgetContext.Provider>
  );
}

export function useWidget(): WidgetRenderContext {
  const ctx = useContext(WidgetContext);
  if (!ctx) {
    throw new Error("useWidget must be used inside a <WidgetProvider>");
  }
  return ctx;
}
