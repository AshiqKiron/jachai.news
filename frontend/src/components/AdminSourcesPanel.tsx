"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ADMIN_INGEST_CLIENT_TIMEOUT_MS,
  deleteAdminRoute,
  patchAdminRoute,
  postAdminFormRoute,
  postAdminRoute,
} from "@/lib/admin-proxy-client";
import type { IngestResponse } from "@/lib/admin-types";
import {
  ACCEPT_FEED_UPLOAD,
  buildFileSourcePayload,
  buildRssSourcePayload,
  feedUrlDraftForSource,
  validateFileSourceInput,
  validateRssSourceInput,
} from "@/lib/admin-input";
import type { AdminSourceStat } from "@/lib/admin-types";
type Props = {
  sources: AdminSourceStat[];
  onFeedsChanged?: () => void;
};

function notifyFeedsChanged(onFeedsChanged?: () => void) {
  window.dispatchEvent(new CustomEvent("shorup:admin-refresh"));
  onFeedsChanged?.();
}

export function AdminSourcesPanel({ sources, onFeedsChanged }: Props) {
  const [name, setName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [biasScore, setBiasScore] = useState("");
  const [addMode, setAddMode] = useState<"rss" | "file">("rss");
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [fetchingId, setFetchingId] = useState<number | null>(null);
  const [savingUrlId, setSavingUrlId] = useState<number | null>(null);
  const [urlDrafts, setUrlDrafts] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeSources = useMemo(
    () => sources.filter((source) => !source.disabled),
    [sources],
  );
  const disabledSources = useMemo(
    () => sources.filter((source) => source.disabled),
    [sources],
  );

  const activeSourceFeedKey = useMemo(
    () => activeSources.map((s) => `${s.source_id}:${s.feed_url}`).join("|"),
    [activeSources],
  );

  useEffect(() => {
    setUrlDrafts((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const source of sources) {
        if (source.disabled) continue;
        const draft = feedUrlDraftForSource(source);
        if (prev[source.source_id] === undefined || prev[source.source_id] === draft) {
          if (next[source.source_id] !== draft) {
            next[source.source_id] = draft;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
    // `activeSourceFeedKey` only — parent may pass a new `sources` array reference every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when feed URLs change, not on array identity
  }, [activeSourceFeedKey]);

  async function importFeedFile(sourceId: number, file: File) {
    const form = new FormData();
    form.append("file", file, file.name);
    const result = await postAdminFormRoute<IngestResponse>(
      `/api/admin/sources/${sourceId}/import`,
      form,
      ADMIN_INGEST_CLIENT_TIMEOUT_MS,
    );
    return result;
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const validation =
      addMode === "file"
        ? validateFileSourceInput(name, biasScore)
        : validateRssSourceInput(name, feedUrl, biasScore);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    if (addMode === "file" && !createFile) {
      setError("Choose a .json or .rss file to import.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (addMode === "file") {
        const payload = buildFileSourcePayload(name, biasScore);
        const created = await postAdminRoute<AdminSourceStat>("/api/admin/sources", payload);
        const result = await importFeedFile(created.source_id, createFile as File);
        setMessage(
          `${payload.name}: imported ${formatFetchResult(payload.name, result)} Articles stay in the DB; set a live RSS URL later to switch from file to automatic pulls.`,
        );
      } else {
        const payload = buildRssSourcePayload(name, feedUrl, biasScore);
        await postAdminRoute("/api/admin/sources", payload);
        setMessage(`Saved ${payload.name} to the ingest list (live RSS).`);
      }

      setName("");
      setFeedUrl("");
      setBiasScore("");
      setCreateFile(null);
      notifyFeedsChanged(onFeedsChanged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImportForSource(source: AdminSourceStat, file: File) {
    setImportingId(source.source_id);
    setError(null);
    setMessage(null);
    try {
      const result = await importFeedFile(source.source_id, file);
      setMessage(formatFetchResult(source.name, result));
      notifyFeedsChanged(onFeedsChanged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import file.");
    } finally {
      setImportingId(null);
    }
  }

  function formatFetchResult(sourceName: string, result: IngestResponse): string {
    const parts = [
      `${sourceName}: ${result.articles_fetched} in RSS, ${result.articles_created} new saved.`,
    ];
    if (result.articles_skipped_duplicate > 0) {
      parts.push(`${result.articles_skipped_duplicate} already in DB (same URL).`);
    }
    if (result.errors.length > 0) {
      parts.push(result.errors.join(" "));
    }
    return parts.join(" ");
  }

  async function handleFetchNow(source: AdminSourceStat) {
    setFetchingId(source.source_id);
    setError(null);
    setMessage(null);
    try {
      const result = await postAdminRoute<IngestResponse>(
        `/api/admin/sources/${source.source_id}/ingest`,
        undefined,
        ADMIN_INGEST_CLIENT_TIMEOUT_MS,
      );
      setMessage(formatFetchResult(source.name, result));
      notifyFeedsChanged(onFeedsChanged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch RSS feed.");
    } finally {
      setFetchingId(null);
    }
  }

  async function handleSaveUrl(source: AdminSourceStat) {
    const draft = (urlDrafts[source.source_id] ?? feedUrlDraftForSource(source)).trim();
    const validation = validateRssSourceInput(source.name, draft, "");
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    if (draft === feedUrlDraftForSource(source)) return;

    setSavingUrlId(source.source_id);
    setError(null);
    setMessage(null);
    try {
      await patchAdminRoute(`/api/admin/sources/${source.source_id}`, { feed_url: draft });
      setMessage(
        `Saved live RSS for ${source.name}. Scheduled ingest and Fetch now will use the database feed from this URL (file-import mode is off).`,
      );
      notifyFeedsChanged(onFeedsChanged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feed URL.");
    } finally {
      setSavingUrlId(null);
    }
  }

  async function handleRemove(source: AdminSourceStat) {
    const confirmRemove = window.confirm(
      `Remove "${source.name}" from RSS ingest? All articles from this feed will be deleted from Shorup.`,
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
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Add outlet</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Use <strong className="font-medium text-zinc-300">live RSS</strong> for automatic pulls, or{" "}
          <strong className="font-medium text-zinc-300">upload a file</strong> (extension JSON, .rss, .xml).
          Uploaded articles go into the database like RSS pulls. Later, save a real RSS URL on that outlet to
          switch from file imports to live feeds — existing articles stay in the DB.
        </p>
        <fieldset className="mt-4 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 text-zinc-300">
            <input
              type="radio"
              name="addMode"
              checked={addMode === "rss"}
              onChange={() => setAddMode("rss")}
            />
            Live RSS URL
          </label>
          <label className="flex items-center gap-2 text-zinc-300">
            <input
              type="radio"
              name="addMode"
              checked={addMode === "file"}
              onChange={() => setAddMode("file")}
            />
            Import feed file
          </label>
        </fieldset>
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
          {addMode === "rss" ? (
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
          ) : (
            <label className="block text-sm sm:col-span-2">
              <span className="text-zinc-500">Feed file (.json, .rss, .xml)</span>
              <input
                type="file"
                required
                accept={ACCEPT_FEED_UPLOAD}
                onChange={(event) => setCreateFile(event.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-zinc-100"
              />
            </label>
          )}
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
              {loading ? "Saving…" : addMode === "file" ? "Create & import file" : "Save feed"}
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
                <th className="px-4 py-3 font-medium">Ingest</th>
                <th className="px-4 py-3 font-medium">RSS URL</th>
                <th className="px-4 py-3 font-medium">Articles</th>
                <th className="px-4 py-3 font-medium">Bias</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-200">
              {activeSources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                    No active RSS feeds. Save one above.
                  </td>
                </tr>
              ) : (
                activeSources.map((source) => {
                  const draft = urlDrafts[source.source_id] ?? feedUrlDraftForSource(source);
                  const urlDirty = draft.trim() !== feedUrlDraftForSource(source);
                  const rowBusy =
                    removingId === source.source_id ||
                    fetchingId === source.source_id ||
                    savingUrlId === source.source_id ||
                    importingId === source.source_id;
                  const fileMode = source.ingest_mode === "file";

                  return (
                    <tr key={source.source_id}>
                      <td className="px-4 py-3 font-medium">{source.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            fileMode
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {fileMode ? "File" : "RSS"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="url"
                          value={draft}
                          onChange={(event) =>
                            setUrlDrafts((prev) => ({
                              ...prev,
                              [source.source_id]: event.target.value,
                            }))
                          }
                          placeholder={
                            fileMode ? "Paste live RSS URL, then Save URL" : "https://…"
                          }
                          className="w-full min-w-[12rem] rounded-lg border border-zinc-700 bg-ink-950 px-2 py-1.5 text-xs text-zinc-100"
                        />
                      </td>
                      <td className="px-4 py-3">{source.article_count}</td>
                      <td className="px-4 py-3">
                        {source.bias_score === null ? "—" : source.bias_score.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-3">
                          <label className="cursor-pointer text-sm text-zinc-300 hover:text-zinc-100">
                            <input
                              type="file"
                              accept={ACCEPT_FEED_UPLOAD}
                              className="sr-only"
                              disabled={rowBusy}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (file) void handleImportForSource(source, file);
                              }}
                            />
                            {importingId === source.source_id ? "Importing…" : "Upload file"}
                          </label>
                          <button
                            type="button"
                            onClick={() => void handleSaveUrl(source)}
                            disabled={rowBusy || !urlDirty}
                            className="text-sm text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                          >
                            {savingUrlId === source.source_id ? "Saving…" : "Save URL"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleFetchNow(source)}
                            disabled={rowBusy || fileMode}
                            title={
                              fileMode
                                ? "Save a live RSS URL first to enable automatic fetches"
                                : undefined
                            }
                            className="text-sm text-accent hover:text-accent/90 disabled:opacity-60"
                          >
                            {fetchingId === source.source_id ? "Fetching…" : "Fetch now"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleRemove(source)}
                            disabled={rowBusy}
                            className="text-sm text-red-400 hover:text-red-300 disabled:opacity-60"
                          >
                            {removingId === source.source_id ? "Removing…" : "Remove"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              <li
                key={source.source_id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <span className="text-zinc-300">{source.name}</span>
                  <div className="max-w-md truncate text-xs text-zinc-600">{source.feed_url}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">save with same name to re-enable</span>
                  <button
                    type="button"
                    onClick={() => void handleRemove(source)}
                    disabled={removingId === source.source_id}
                    className="text-sm text-red-400 hover:text-red-300 disabled:opacity-60"
                  >
                    {removingId === source.source_id ? "Removing…" : "Remove"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
