"use client";

import { banglaHeaderDateTimeIso, formatBanglaHeaderDate } from "@/lib/bangla-date";

const defaultClassName =
  "block truncate font-bengali text-[11px] leading-snug text-zinc-500 sm:text-xs dark:text-zinc-400";

export function HeaderBanglaDate({ className }: { className?: string }) {
  const now = new Date();

  return (
    <time
      dateTime={banglaHeaderDateTimeIso(now)}
      suppressHydrationWarning
      className={
        className ? `block font-bengali leading-snug ${className}` : defaultClassName
      }
    >
      {formatBanglaHeaderDate(now)}
    </time>
  );
}
