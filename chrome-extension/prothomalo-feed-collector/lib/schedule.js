/** Chrome `chrome.alarms` minimum period is 1 minute. */
export const MIN_PERIOD_MINUTES = 1;

/** ~1 year ceiling to avoid overflow / absurd values */
export const MAX_PERIOD_MINUTES = 365 * 24 * 60;

/**
 * @param {{ scheduleIntervalValue?: number, scheduleIntervalUnit?: string }} settings
 * @returns {number}
 */
export function periodMinutesFromSettings(settings) {
  const raw = Number(settings.scheduleIntervalValue);
  const value =
    Number.isFinite(raw) && raw >= 1
      ? Math.floor(raw)
      : 1;
  const unit = settings.scheduleIntervalUnit ?? "hours";

  let minutes;
  switch (unit) {
    case "minutes":
      minutes = value;
      break;
    case "days":
      minutes = value * 24 * 60;
      break;
    case "hours":
    default:
      minutes = value * 60;
      break;
  }

  return Math.min(MAX_PERIOD_MINUTES, Math.max(MIN_PERIOD_MINUTES, minutes));
}

/**
 * Human-readable summary for the popup / docs.
 * @param {{ scheduleIntervalValue?: number, scheduleIntervalUnit?: string }} settings
 */
export function describeSchedule(settings) {
  const raw = Number(settings.scheduleIntervalValue);
  const value =
    Number.isFinite(raw) && raw >= 1
      ? Math.floor(raw)
      : 1;
  const unit = settings.scheduleIntervalUnit ?? "hours";
  const u =
    unit === "minutes"
      ? value === 1
        ? "minute"
        : "minutes"
      : unit === "days"
        ? value === 1
          ? "day"
          : "days"
        : value === 1
          ? "hour"
          : "hours";
  return `every ${value} ${u}`;
}
