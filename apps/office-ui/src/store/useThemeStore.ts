import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark' as Theme,
      resolvedTheme: 'dark' as 'dark' | 'light',
      setTheme: (theme: Theme) => {
        const resolved = theme === 'system'
          ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
          : theme;
        set({ theme, resolvedTheme: resolved });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('light', resolved === 'light');
          document.documentElement.classList.toggle('dark', resolved === 'dark');
        }
      },
    }),
    { name: 'urule-theme' }
  )
);
