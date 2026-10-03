"use client";

import { banglaHeaderDateTimeIso, formatBanglaHeaderDate } from "@/lib/bangla-date";

export function HeaderBanglaDate() {
  const now = new Date();

  return (
    <time
      dateTime={banglaHeaderDateTimeIso(now)}
      suppressHydrationWarning
      className="block font-bengali text-xs leading-snug text-zinc-500 dark:text-zinc-400"
    >
      {formatBanglaHeaderDate(now)}
    </time>
  );
}
