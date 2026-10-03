"use client";

import Link from "next/link";

import { AuthNav } from "@/components/auth/AuthNav";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { href: "/", label: "Home" },
  { href: "/blindspot", label: "Blindspot" },
  { href: "/browse", label: "Browse" },
  { href: "/rumors", label: "Rumors" },
  { href: "/verify", label: "Verify" },
  { href: "/bias", label: "Bias" },
  { href: "/pro", label: "Pro" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-ink-900/90 backdrop-blur dark:bg-ink-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl tracking-tight text-zinc-50">
          Jachai<span className="text-accent dark:text-neutral-500">.</span>
          <span className="font-bengali text-lg">নিউজ</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-5">
          <nav className="hidden gap-5 text-sm text-zinc-300 md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-zinc-900 dark:hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
