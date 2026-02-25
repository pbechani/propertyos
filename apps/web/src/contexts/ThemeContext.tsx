'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
const LOCKED_THEME: Theme = "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isThemeLocked: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Reads the preferred theme synchronously during state initialisation so the
 * correct class is applied on the **first render**, eliminating FOUC.
 * The inline script in index.html applies the class before React hydrates;
 * this function keeps the React state in sync with that initial class.
 */
function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    // localStorage unavailable
  }
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(LOCKED_THEME);

  useEffect(() => {
    setThemeState(LOCKED_THEME);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(LOCKED_THEME);
    localStorage.setItem("theme", LOCKED_THEME);
  }, [theme]);

  const setTheme = (_nextTheme: Theme) => {
    setThemeState(LOCKED_THEME);
  };

  const toggleTheme = () => {
    setThemeState(LOCKED_THEME);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isThemeLocked: true,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}