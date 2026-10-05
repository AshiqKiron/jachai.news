"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ADMIN_INGEST_CLIENT_TIMEOUT_MS, patchAdminRoute, postAdminRoute } from "@/lib/admin-proxy-client";
import type { AdminIngestSchedule, IngestResponse } from "@/lib/admin-types";
import {
  formatIngestScheduleHint,
  ingestIntervalLabel,
  nextIngestPullEstimate,
} from "@/lib/ingest-schedule";

type Props = {
  initialSchedule?: AdminIngestSchedule | null;
};

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}

export function AdminIngestPanel({ initialSchedule = null }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<AdminIngestSchedule | null>(initialSchedule);
  const [intervalDraft, setIntervalDraft] = useState<number>(
    initialSchedule?.interval_minutes ?? 60,
  );
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  const loadSchedule = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/ingest-schedule");
      if (!response.ok) return;
      const data = (await response.json()) as AdminIngestSchedule;
      setSchedule(data);
      setIntervalDraft(data.interval_minutes);
    } catch {
      // keep last known schedule
    }
  }, []);

  useEffect(() => {
    if (!initialSchedule) {
      void loadSchedule();
    }
  }, [initialSchedule, loadSchedule]);

  useEffect(() => {
    function onRefresh() {
      void loadSchedule();
    }
    window.addEventListener("shorup:admin-refresh", onRefresh);
    return () => window.removeEventListener("shorup:admin-refresh", onRefresh);
  }, [loadSchedule]);

  const intervalOptions = useMemo(() => {
    const allowed = schedule?.allowed_intervals_minutes ?? [15, 30, 60, 120, 360, 720, 1440];
    return allowed.map((minutes) => ({ minutes, label: ingestIntervalLabel(minutes) }));
  }, [schedule?.allowed_intervals_minutes]);

  const scheduleDirty = schedule != null && intervalDraft !== schedule.interval_minutes;
  const nextPullHint = schedule ? nextIngestPullEstimate(schedule) : null;

  async function saveSchedule() {
    if (!scheduleDirty) return;
    setScheduleSaving(true);
    setScheduleError(null);
    setScheduleSaved(false);
    try {
      const data = await patchAdminRoute<AdminIngestSchedule>("/api/admin/ingest-schedule", {
        interval_minutes: intervalDraft,
      });
      setSchedule(data);
      setIntervalDraft(data.interval_minutes);
      setScheduleSaved(true);
      window.dispatchEvent(new CustomEvent("shorup:admin-refresh"));
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : "Could not save schedule.");
    } finally {
      setScheduleSaving(false);
    }
  }

  async function runIngest() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await postAdminRoute<IngestResponse>(
        "/api/admin/ingest",
        undefined,
        ADMIN_INGEST_CLIENT_TIMEOUT_MS,
      );
      setResult(data);
      window.dispatchEvent(new CustomEvent("shorup:admin-refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingest failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5">
      <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">RSS ingest</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Pull feeds, dedupe articles, and refresh clusters. Uses the same pipeline as{" "}
        <code className="text-zinc-300">POST /api/v1/ingest</code>.
      </p>

      <div className="mt-5 rounded-lg border border-zinc-800/80 bg-ink-950/40 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Pull frequency</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1.5 text-sm text-zinc-300">
            <span className="text-zinc-500">How often to fetch RSS feeds</span>
            <select
              value={intervalDraft}
              onChange={(event) => {
                setIntervalDraft(Number(event.target.value));
                setScheduleSaved(false);
              }}
              className="rounded-lg border border-zinc-700 bg-ink-900 px-3 py-2 text-zinc-100"
            >
              {intervalOptions.map((option) => (
                <option key={option.minutes} value={option.minutes}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void saveSchedule()}
            disabled={scheduleSaving || !scheduleDirty}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-100 disabled:opacity-50"
          >
            {scheduleSaving ? "Saving…" : "Save frequency"}
          </button>
        </div>
        {schedule ? (
          <p className="mt-3 text-xs text-zinc-500">{formatIngestScheduleHint(schedule)}</p>
        ) : null}
        {nextPullHint ? <p className="mt-1 text-xs text-zinc-400">{nextPullHint}</p> : null}
        {schedule?.last_scheduled_at ? (
          <p className="mt-1 text-xs text-zinc-500">
            Last automatic pull queued: {formatWhen(schedule.last_scheduled_at)}
          </p>
        ) : null}
        {scheduleError ? <p className="mt-2 text-sm text-red-400">{scheduleError}</p> : null}
        {scheduleSaved ? <p className="mt-2 text-sm text-emerald-400">Pull frequency saved.</p> : null}
      </div>

      <button
        type="button"
        onClick={() => void runIngest()}
        disabled={loading}
        className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink-950 disabled:opacity-60"
      >
        {loading ? "Running ingest (may queue on worker)…" : "Run ingest now"}
      </button>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {result ? (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Sources processed</dt>
            <dd className="text-zinc-100">{result.sources_processed}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Articles fetched</dt>
            <dd className="text-zinc-100">{result.articles_fetched}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Articles created</dt>
            <dd className="text-zinc-100">{result.articles_created}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Duplicates skipped</dt>
            <dd className="text-zinc-100">{result.articles_skipped_duplicate}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Clusters created</dt>
            <dd className="text-zinc-100">{result.clusters_created}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Clusters updated</dt>
            <dd className="text-zinc-100">{result.clusters_updated}</dd>
          </div>
        </dl>
      ) : null}
      {result?.errors.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-300">
          {result.errors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
