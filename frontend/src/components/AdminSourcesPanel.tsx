"use client";

import { useState } from "react";

import { deleteAdminRoute, postAdminRoute } from "@/lib/admin-proxy-client";
import { buildRssSourcePayload, validateRssSourceInput } from "@/lib/admin-input";
import type { AdminSourceStat } from "@/lib/admin-types";
type Props = {
  sources: AdminSourceStat[];
  onFeedsChanged?: () => void;
};

function notifyFeedsChanged(onFeedsChanged?: () => void) {
  window.dispatchEvent(new CustomEvent("jachai:admin-refresh"));
  onFeedsChanged?.();
}

export function AdminSourcesPanel({ sources, onFeedsChanged }: Props) {
  const [name, setName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [biasScore, setBiasScore] = useState("");
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeSources = sources.filter((source) => !source.disabled);
  const disabledSources = sources.filter((source) => source.disabled);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const validation = validateRssSourceInput(name, feedUrl, biasScore);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = buildRssSourcePayload(name, feedUrl, biasScore);
      await postAdminRoute("/api/admin/sources", payload);

      setName("");
      setFeedUrl("");
      setBiasScore("");
      setMessage(`Added ${payload.name} to the ingest list.`);
      notifyFeedsChanged(onFeedsChanged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add source.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(source: AdminSourceStat) {
    const confirmRemove = window.confirm(
      `Remove "${source.name}" from RSS ingest? All articles from this feed will be deleted from Jachai.`,
    );
    if (!confirmRemove) return;

    setRemovingId(source.source_id);
    setError(null);
    setMessage(null);
    try {
      await deleteAdminRoute(`/api/admin/sources/${source.source_id}`);
      setMessage(`Removed ${source.name} from ingest and deleted its articles.`);
      notifyFeedsChanged(onFeedsChanged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove source.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5">
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Add RSS feed</h2>
        <p className="mt-2 text-sm text-zinc-400">
          New feeds are included on the next ingest run. Re-adding a disabled outlet with the same name turns it back
          on.
        </p>
        <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="text-zinc-500">Outlet name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example News"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-ink-950 px-3 py-2 text-zinc-100"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-zinc-500">RSS feed URL</span>
            <input
              type="url"
              required
              value={feedUrl}
              onChange={(event) => setFeedUrl(event.target.value)}
              placeholder="https://example.com/rss.xml"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-ink-950 px-3 py-2 text-zinc-100"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500">Bias (-1 … 1, optional)</span>
            <input
              type="text"
              inputMode="decimal"
              value={biasScore}
              onChange={(event) => setBiasScore(event.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-ink-950 px-3 py-2 text-zinc-100"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink-950 disabled:opacity-60"
            >
              {loading ? "Adding…" : "Add feed"}
            </button>
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-500">
          Active feeds ({activeSources.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ink-900/80 text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Outlet</th>
                <th className="px-4 py-3 font-medium">Articles</th>
                <th className="px-4 py-3 font-medium">Bias</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-200">
              {activeSources.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                    No active RSS feeds.
                  </td>
                </tr>
              ) : (
                activeSources.map((source) => (
                  <tr key={source.source_id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{source.name}</div>
                      <div className="max-w-md truncate text-xs text-zinc-500">{source.feed_url}</div>
                    </td>
                    <td className="px-4 py-3">{source.article_count}</td>
                    <td className="px-4 py-3">
                      {source.bias_score === null ? "—" : source.bias_score.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(source)}
                        disabled={removingId === source.source_id}
                        className="text-sm text-red-400 hover:text-red-300 disabled:opacity-60"
                      >
                        {removingId === source.source_id ? "Removing…" : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {disabledSources.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-500">
            Disabled feeds ({disabledSources.length})
          </h2>
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 text-sm text-zinc-400">
            {disabledSources.map((source) => (
              <li key={source.source_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <span className="text-zinc-300">{source.name}</span>
                  <span className="ml-2 text-xs text-zinc-600">not ingested</span>
                </div>
                <span className="text-xs">re-add by name to ingest again</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
