"use client";

import React from "react";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "hover:cursor-pointer flex w-full items-center gap-3 px-3 py-3 rounded-xl transition-all text-left",
        "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5",
        className
      )}
    >
      <span className="material-symbols-outlined text-[24px]">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
      <span className="text-sm font-medium">
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}
