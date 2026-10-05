/** English relative time for cluster “last updated” (e.g. “2 hours ago”). */
export function formatRelativeTimeEn(iso: string, nowMs = Date.now()): string {
  const thenMs = Date.parse(iso);
  if (Number.isNaN(thenMs)) return "—";

  const diffSec = Math.round((thenMs - nowMs) / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSec < 45) return rtf.format(diffSec, "second");
  if (absSec < 45 * 60) return rtf.format(Math.round(diffSec / 60), "minute");
  if (absSec < 22 * 60 * 60) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (absSec < 26 * 24 * 60 * 60) return rtf.format(Math.round(diffSec / 86400), "day");
  if (absSec < 320 * 24 * 60 * 60) return rtf.format(Math.round(diffSec / (86400 * 30)), "month");
  return rtf.format(Math.round(diffSec / (86400 * 365)), "year");
}
