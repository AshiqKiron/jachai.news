import type { AdminIngestSchedule } from "@/lib/admin-types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Human labels for allowed backend intervals (minutes). */
export function ingestIntervalLabel(minutes: number): string {
  if (minutes < 60) return `Every ${minutes} minutes`;
  if (minutes === 60) return "Every hour";
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "Every hour" : `Every ${hours} hours`;
  }
  return `Every ${minutes} minutes`;
}

export function formatIngestScheduleHint(schedule: AdminIngestSchedule): string {
  if (schedule.scheduler_enabled) {
    return `Automatic pulls run about ${ingestIntervalLabel(schedule.interval_minutes).toLowerCase()} when Celery beat is running.`;
  }
  return "Set REDIS_URL and run Celery beat for automatic pulls, or use an external cron calling POST /api/v1/ingest.";
}

export function nextIngestPullEstimate(schedule: AdminIngestSchedule): string | null {
  if (!schedule.scheduler_enabled || !schedule.last_scheduled_at) return null;
  const last = new Date(schedule.last_scheduled_at).getTime();
  if (Number.isNaN(last)) return null;
  const next = last + schedule.interval_minutes * MINUTE;
  const delta = next - Date.now();
  if (delta <= 0) return "Due now (beat checks every minute)";
  if (delta < HOUR) {
    const mins = Math.ceil(delta / MINUTE);
    return `Next automatic pull in ~${mins} min`;
  }
  const hours = Math.ceil(delta / HOUR);
  return `Next automatic pull in ~${hours} h`;
}
