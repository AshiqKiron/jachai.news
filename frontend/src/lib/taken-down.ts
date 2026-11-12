const DHAKA_TZ = "Asia/Dhaka";
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export type TakenDownFields = {
  removedAt?: string;
  publishedAt: string;
  headline: string;
  excerpt: string;
  sourceName?: string;
};

/** Articles an outlet deleted or set to 404, latest removal first. */
export function takenDownArticles<T extends { removedAt?: string }>(articles: T[]): T[] {
  return articles
    .filter((article) => Boolean(article.removedAt))
    .sort((a, b) => Date.parse(b.removedAt ?? "") - Date.parse(a.removedAt ?? ""));
}

function toBengaliDigits(value: string): string {
  return value.replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);
}

function dhakaClock(iso: string): { hour12: number; minute: string; hour24: number; period: "am" | "pm" } | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const hour24 = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: DHAKA_TZ,
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  );
  const minute = new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TZ,
    minute: "2-digit",
  }).format(date);

  if (Number.isNaN(hour24)) return null;

  const period: "am" | "pm" = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute, hour24, period };
}

/** `6:40pm` / `1:12pm` in Dhaka. */
export function formatVaultClockEn(iso: string): string {
  const clock = dhakaClock(iso);
  if (!clock) return "—";
  return `${clock.hour12}:${clock.minute}${clock.period}`;
}

/** `সন্ধ্যা ৬:৪০` / `দুপুর ১:১২` in Dhaka. */
export function formatVaultClockBn(iso: string): string {
  const clock = dhakaClock(iso);
  if (!clock) return "—";
  const dayPart =
    clock.hour24 >= 5 && clock.hour24 < 12
      ? "সকাল"
      : clock.hour24 >= 12 && clock.hour24 < 16
        ? "দুপুর"
        : clock.hour24 >= 16 && clock.hour24 < 18
          ? "বিকেল"
          : clock.hour24 >= 18 && clock.hour24 < 20
            ? "সন্ধ্যা"
            : "রাত";
  return `${dayPart} ${toBengaliDigits(String(clock.hour12))}:${toBengaliDigits(clock.minute)}`;
}

export function removalLineEn(removedAt: string): string {
  return `Removed from their site at ${formatVaultClockEn(removedAt)}.`;
}

export function removalLineBn(removedAt: string): string {
  return `তাদের সাইট থেকে ${formatVaultClockBn(removedAt)}-এ সরানো হয়েছে।`;
}

export function saidAtLineEn(publishedAt: string): string {
  return `This is what it said at ${formatVaultClockEn(publishedAt)}.`;
}

export function saidAtLineBn(publishedAt: string): string {
  return `${formatVaultClockBn(publishedAt)}-এ এটাই লেখা ছিল।`;
}

export function latestRemovalLineEn(articles: { removedAt?: string }[]): string | null {
  const [latest] = takenDownArticles(articles);
  if (!latest?.removedAt) return null;
  return removalLineEn(latest.removedAt);
}
