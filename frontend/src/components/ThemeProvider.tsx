"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { useEffect } from "react";

const THEME_STORAGE_KEY = "theme";

/** Drop legacy "system" preference so old Auto users stay on light with system disabled. */
function MigrateSystemTheme() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "system" || theme === "system") {
        localStorage.setItem(THEME_STORAGE_KEY, "light");
        setTheme("light");
      }
    } catch {
      if (theme === "system") setTheme("light");
    }
  }, [theme, setTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey={THEME_STORAGE_KEY}
      themes={["light", "dark"]}
      disableTransitionOnChange
      {...props}
    >
      <MigrateSystemTheme />
      {children}
    </NextThemesProvider>
  );
}
