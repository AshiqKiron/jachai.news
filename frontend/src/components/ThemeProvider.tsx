"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { useEffect } from "react";

/** Drop legacy "system" preference so new installs and old Auto users start on light. */
function MigrateSystemTheme() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme === "system") setTheme("light");
  }, [theme, setTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      <MigrateSystemTheme />
      {children}
    </NextThemesProvider>
  );
}
