'use client';

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative border-gray-300 dark:border-gray-700"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export function ThemeToggleWithLabel() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      onClick={toggleTheme}
      className="border-gray-300 dark:border-gray-700"
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4 mr-2" />
          Dark Mode
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 mr-2" />
          Light Mode
        </>
      )}
    </Button>
  );
}

export function ThemeToggleDropdown() {
  const { theme, setTheme } = useTheme();

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
        <Sun className="h-4 w-4" />
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
        <Moon className="h-4 w-4" />
        <span className="text-sm font-medium">Dark</span>
      </button>
    </div>
  );
}
