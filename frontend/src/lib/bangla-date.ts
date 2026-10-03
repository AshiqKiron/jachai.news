const DHAKA_TZ = "Asia/Dhaka";

const headerDateFormatter = new Intl.DateTimeFormat("bn-BD", {
  timeZone: DHAKA_TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const headerDateIsoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DHAKA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Gregorian calendar date in Bangla for header / bylines (Dhaka timezone). */
export function formatBanglaHeaderDate(date: Date = new Date()): string {
  return headerDateFormatter.format(date);
}

/** `YYYY-MM-DD` in Dhaka for `<time dateTime>`. */
export function banglaHeaderDateTimeIso(date: Date = new Date()): string {
  return headerDateIsoFormatter.format(date);
}
