import { create } from "zustand";

interface AgentStatus {
  id: string;
  status: "active" | "thinking" | "idle" | "offline" | "busy" | "deployable";
  current_task?: string;
}

interface OfficeState {
  agentStatuses: Map<string, AgentStatus>;
  setAgentStatus: (agentId: string, status: AgentStatus) => void;
  clearAgentStatuses: () => void;
}

export const useOfficeStore = create<OfficeState>((set) => ({
  agentStatuses: new Map(),

  setAgentStatus: (agentId, status) =>
    set((state) => {
      const next = new Map(state.agentStatuses);
      next.set(agentId, status);
      return { agentStatuses: next };
    }),

  clearAgentStatuses: () => set({ agentStatuses: new Map() }),
}));
