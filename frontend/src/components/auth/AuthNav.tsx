"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { adminSurfacePath, isAdminAppSurface } from "@/lib/admin-host";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AuthNav() {
  const router = useRouter();
  const pathname = usePathname();
  const host = typeof window !== "undefined" ? window.location.hostname : undefined;
  const hideSignUp = isAdminAppSurface(pathname, host);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setReady(true);
      return;
    }

    supabase.auth.getUser().then(({ data }: { data: { user: { email?: string | null } | null } }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setEmail(null);
    router.refresh();
  }

  if (!ready) {
    return <div className="h-9 w-24" aria-hidden />;
  }

  if (email) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[10rem] truncate text-xs text-zinc-400 md:inline">{email}</span>
        <button
          type="button"
          onClick={signOut}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 md:px-4 md:py-2 md:text-sm"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={hideSignUp ? adminSurfacePath("login", host) : "/sign-in"}
        className={
          hideSignUp
            ? "rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-dark md:px-4 md:py-2 md:text-sm"
            : "rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 md:px-4 md:py-2 md:text-sm"
        }
      >
        Sign in
      </Link>
      {hideSignUp ? null : (
        <Link
          href="/sign-up"
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-dark md:px-4 md:py-2 md:text-sm"
        >
          Sign up
        </Link>
      )}
    </div>
  );
}
