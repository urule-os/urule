import { create } from "zustand";

interface WidgetState {
  /** The active widget instance ID in the main-panel zone (tab behavior) */
  activeMainWidgetId: string | null;
  setActiveMainWidget: (instanceId: string | null) => void;
}

export const useWidgetStore = create<WidgetState>((set) => ({
  activeMainWidgetId: null,
  setActiveMainWidget: (instanceId) => set({ activeMainWidgetId: instanceId }),
}));
