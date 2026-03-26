import { create } from "zustand";

/** Accumulates streaming token deltas keyed by message ID. */
interface ChatState {
  streamingMessages: Map<string, string>;
  appendDelta: (messageId: string, delta: string) => void;
  finalizeMessage: (messageId: string) => void;
  // Aliases for convenience
  setStreamingDelta: (messageId: string, delta: string) => void;
  clearStreaming: (messageId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  streamingMessages: new Map(),

  appendDelta: (messageId, delta) =>
    set((state) => {
      const next = new Map(state.streamingMessages);
      next.set(messageId, (next.get(messageId) ?? "") + delta);
      return { streamingMessages: next };
    }),

  finalizeMessage: (messageId) =>
    set((state) => {
      const next = new Map(state.streamingMessages);
      next.delete(messageId);
      return { streamingMessages: next };
    }),

  setStreamingDelta: (messageId, delta) =>
    set((state) => {
      const next = new Map(state.streamingMessages);
      next.set(messageId, (next.get(messageId) ?? "") + delta);
      return { streamingMessages: next };
    }),

  clearStreaming: (messageId) =>
    set((state) => {
      const next = new Map(state.streamingMessages);
      next.delete(messageId);
      return { streamingMessages: next };
    }),
}));
