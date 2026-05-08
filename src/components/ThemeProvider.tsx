'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme') as Theme | null;
      if (saved) {
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
        return;
      }
    } catch {
      // Storage unavailable (Safari private, sandboxed iframe, etc.)
    }
    // Default to light for all first-time visitors regardless of system preference
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch { /* noop */ }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
