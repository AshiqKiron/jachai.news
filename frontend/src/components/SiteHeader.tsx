"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AuthNav } from "@/components/auth/AuthNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { adminSurfacePath, isAdminAppSurface } from "@/lib/admin-host";

export function SiteHeader() {
  const pathname = usePathname();
  const host = typeof window !== "undefined" ? window.location.hostname : undefined;
  const admin = isAdminAppSurface(pathname, host);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-ink-900/90 backdrop-blur dark:bg-ink-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Link
            href={admin ? adminSurfacePath("", host) : "/"}
            className="font-display text-lg tracking-tight text-zinc-50 sm:text-xl"
          >
            shorup<span className="text-accent">.</span>news
          </Link>
          {!admin ? (
            <p className="text-[11px] leading-snug text-zinc-500 sm:text-xs dark:text-zinc-400">
              This country deserves a better class of media.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4 md:gap-6">
          <ThemeToggle />
          {!admin && <AuthNav />}
        </div>
      </div>
    </header>
  );
}
