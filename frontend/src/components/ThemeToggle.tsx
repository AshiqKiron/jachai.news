"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeChoice = "light" | "dark" | "system";

const options: { value: ThemeChoice; label: string; title: string }[] = [
  { value: "light", label: "Light", title: "Light mode" },
  { value: "dark", label: "Dark", title: "Dark mode" },
  { value: "system", label: "Auto", title: "Match system appearance" },
];

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const active: ThemeChoice =
    theme === "light" || theme === "dark" || theme === "system" ? theme : "system";

  if (!mounted) {
    return (
      <div
        className="h-8 w-[7.25rem] rounded-lg border border-zinc-800/80 bg-ink-900/50"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="flex rounded-lg border border-zinc-800/80 bg-ink-900/50 p-0.5 text-[11px] font-medium"
      role="group"
      aria-label="Color theme"
    >
      {options.map((option) => {
        const isActive = active === option.value;
        return (
          <button
            key={option.value}
            type="button"
            title={option.title}
            aria-pressed={isActive}
            onClick={() => setTheme(option.value)}
            className={`rounded-md px-2 py-1 transition-colors ${
              isActive
                ? "bg-zinc-800 text-zinc-50 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {option.label}
          </button>
        );
      })}
      <span className="sr-only">
        Resolved appearance: {resolvedTheme === "dark" ? "dark" : "light"}
      </span>
    </div>
  );
}
