"use client";

import { Suspense } from "react";
import { WidgetProvider, type WidgetRenderContext } from "./context";
import { widgetRegistry } from "./registry";

interface NativeWidgetRendererProps {
  context: WidgetRenderContext;
  componentPath: string;
}

function WidgetFallback() {
  return (
    <div className="flex items-center justify-center p-4 text-text-muted text-sm">
      <span className="icon text-primary animate-spin mr-2">progress_activity</span>
      Loading widget...
    </div>
  );
}

function WidgetError({ componentPath }: { componentPath: string }) {
  return (
    <div className="flex items-center justify-center p-4 text-accent-warning text-sm">
      <span className="icon mr-2">error</span>
      Widget component not found: {componentPath}
    </div>
  );
}

export function NativeWidgetRenderer({ context, componentPath }: NativeWidgetRendererProps) {
  const Component = widgetRegistry.getComponent(componentPath);

  if (!Component) {
    return <WidgetError componentPath={componentPath} />;
  }

  return (
    <WidgetProvider value={context}>
      <Suspense fallback={<WidgetFallback />}>
        <Component />
      </Suspense>
    </WidgetProvider>
  );
}
