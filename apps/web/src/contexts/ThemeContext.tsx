'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
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
  // Always start with "light" on both server and client to prevent hydration
  // mismatch. The inline script in layout.tsx already applies the correct class
  // to <html> before React hydrates, so there is no FOUC.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Sync React state with the real preference after mount (client-only)
    setTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
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