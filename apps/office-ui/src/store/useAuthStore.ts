import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,

      setTokens: (access, refresh) => {
        set({ access_token: access, refresh_token: refresh, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        set({ user: null, access_token: null, refresh_token: null, isAuthenticated: false });
      },
    }),
    {
      name: "urule-auth",
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
