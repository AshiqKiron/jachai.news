"use client";

import { banglaHeaderDateTimeIso, formatBanglaHeaderDate } from "@/lib/bangla-date";

export function HeaderBanglaDate() {
  const now = new Date();

  return (
    <time
      dateTime={banglaHeaderDateTimeIso(now)}
      suppressHydrationWarning
      className="block truncate font-bengali text-[11px] leading-snug text-zinc-500 sm:text-xs dark:text-zinc-400"
    >
      {formatBanglaHeaderDate(now)}
    </time>
  );
}
