"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { adminSurfacePath, isAdminAppSurface } from "@/lib/admin-host";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const signInMenuLink = { href: "/sign-in", label: "Sign in" };

const registeredMenuLinks = [
  { href: "/profile", label: "Profile" },
  { href: "/blindspot", label: "Blindspot" },
  { href: "/browse", label: "Browse" },
  { href: "/rumors", label: "Rumors" },
  { href: "/verify", label: "Verify" },
  { href: "/bias", label: "Bias" },
] as const;

function ChevronDownIcon({ className, open }: { className?: string; open?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""} ${className ?? ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const signUpButtonClass =
  "rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-dark hover:text-white md:px-4 md:py-2 md:text-sm dark:text-black dark:hover:text-black";

const authMenuPanelClass =
  "absolute right-0 top-full z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-neutral-600 dark:bg-neutral-900";

const authMenuItemClass =
  "block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-100 hover:text-zinc-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white";

export function AuthNav() {
  const router = useRouter();
  const pathname = usePathname();
  const host = typeof window !== "undefined" ? window.location.hostname : undefined;
  const hideSignUp = isAdminAppSurface(pathname, host);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

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
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex max-w-[9rem] items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 sm:max-w-[12rem] sm:px-3 md:max-w-[14rem] md:px-4 md:py-2 md:text-sm"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={menuOpen ? "Close account menu" : "Open account menu"}
        >
          <span className="truncate">{email}</span>
          <ChevronDownIcon open={menuOpen} className="shrink-0" />
        </button>
        {menuOpen ? (
          <div role="menu" className={authMenuPanelClass}>
            {registeredMenuLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={authMenuItemClass}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              className={authMenuItemClass}
              onClick={() => {
                setMenuOpen(false);
                void signOut();
              }}
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (hideSignUp) {
    return (
      <Link href={adminSurfacePath("login", host)} className={signUpButtonClass}>
        Sign in
      </Link>
    );
  }

  if (pathname === "/sign-up") {
    return (
      <Link href={signInMenuLink.href} className={signUpButtonClass}>
        {signInMenuLink.label}
      </Link>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <div className="flex items-stretch">
        <Link href="/pro" className={`${signUpButtonClass} rounded-r-none pr-2 md:pr-3`}>
          Go Pro
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className={`${signUpButtonClass} flex items-center rounded-l-none border-l border-white/20 px-2 md:px-2.5`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <ChevronDownIcon open={menuOpen} />
        </button>
      </div>
      {menuOpen ? (
        <div role="menu" className={`${authMenuPanelClass} inset-x-0 min-w-0`}>
          <Link
            href={signInMenuLink.href}
            role="menuitem"
            className={authMenuItemClass}
            onClick={() => setMenuOpen(false)}
          >
            {signInMenuLink.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
