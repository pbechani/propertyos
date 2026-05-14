'use client';

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { cn } from "./ui/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps = {}) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "flex items-center rounded-full p-0.5 gap-0.5",
        "bg-black/10 dark:bg-white/10",
        className
      )}
    >
      <button
        suppressHydrationWarning
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all duration-200",
          theme === "light"
            ? "bg-white text-[#1A3C28] shadow-sm"
            : "text-white/50 hover:text-white/75"
        )}
        aria-label="Light mode"
      >
        <Sun className="h-3 w-3" />
        <span>Light</span>
      </button>
      <button
        suppressHydrationWarning
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all duration-200",
          theme === "dark"
            ? "bg-[#0C0D10] text-[#00E87A] shadow-sm"
            : "text-white/50 hover:text-white/75"
        )}
        aria-label="Dark mode"
      >
        <Moon className="h-3 w-3" />
        <span>Dark</span>
      </button>
    </div>
  );
}

export function ThemeToggleWithLabel() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {theme === "light" ? (
        <>
          <Moon suppressHydrationWarning className="h-4 w-4" />
          Dark Mode
        </>
      ) : (
        <>
          <Sun suppressHydrationWarning className="h-4 w-4" />
          Light Mode
        </>
      )}
    </button>
  );
}


export function ThemeToggleDropdown() {
  const { theme, setTheme, isThemeLocked } = useTheme();

  if (isThemeLocked) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => setTheme("light")}
        className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
          theme === "light"
            ? "bg-white dark:bg-gray-700 shadow-sm"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <Sun suppressHydrationWarning className="h-4 w-4" />
        <span className="text-sm font-medium">Light</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
          theme === "dark"
            ? "bg-white dark:bg-gray-700 shadow-sm"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <Moon suppressHydrationWarning className="h-4 w-4" />
        <span className="text-sm font-medium">Dark</span>
      </button>
    </div>
  );
}
