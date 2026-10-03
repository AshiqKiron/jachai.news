"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => (mounted ? setTheme(isDark ? "light" : "dark") : undefined)}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800/80 bg-ink-900/50 text-zinc-400 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
      title={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle color theme"}
      aria-label={
        mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle color theme"
      }
    >
      {!mounted ? (
        <MoonIcon className="h-[1.125rem] w-[1.125rem] opacity-0" aria-hidden />
      ) : isDark ? (
        <SunIcon className="h-[1.125rem] w-[1.125rem]" />
      ) : (
        <MoonIcon className="h-[1.125rem] w-[1.125rem]" />
      )}
    </button>
  );
}
