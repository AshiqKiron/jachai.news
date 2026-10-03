"use client";

import { useState } from "react";

import type { IngestResponse } from "@/lib/admin-types";

export function AdminIngestPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runIngest() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/admin/ingest", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Ingest failed.");
      }
      setResult(data as IngestResponse);
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
      <button
        type="button"
        onClick={runIngest}
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
