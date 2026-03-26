"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { widgetRegistry, BUILTIN_MANIFESTS } from "@/widgets";
import { BUILTIN_COMPONENTS } from "@/widgets/builtin";

function useWidgetRegistryInit() {
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized) {
      for (const manifest of BUILTIN_MANIFESTS) {
        widgetRegistry.registerManifest(manifest);
      }
      for (const [path, component] of Object.entries(BUILTIN_COMPONENTS)) {
        widgetRegistry.registerComponent(path, component);
      }
      setInitialized(true);
    }
  }, [initialized]);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  useWidgetRegistryInit();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
