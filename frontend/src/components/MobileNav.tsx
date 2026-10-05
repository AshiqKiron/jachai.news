"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isAdminAppSurface } from "@/lib/admin-host";

const items = [
  { href: "/blindspot", label: "Blindspot", en: "Blindspot" },
  { href: "/browse", label: "ব্রাউজ", en: "Browse" },
  { href: "/bias", label: "ঝুঁক", en: "Bias" },
];

export function MobileNav() {
  const pathname = usePathname();
  const host = typeof window !== "undefined" ? window.location.hostname : undefined;
  if (isAdminAppSurface(pathname, host)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/90 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-lg justify-around px-1 py-2 sm:px-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-w-0 flex-1 flex-col items-center px-2 py-1 text-[11px] sm:px-3 ${
                  active ? "text-accent" : "text-zinc-500"
                }`}
              >
                <span className="font-medium">{item.label}</span>
                <span className="text-[9px] uppercase tracking-wider opacity-70">{item.en}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
