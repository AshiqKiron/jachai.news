"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminSourcesPanel } from "@/components/AdminSourcesPanel";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import type { AdminOverview } from "@/lib/admin-api";
import { collectAdminIssues, countIssuesBySeverity, type AdminIssue } from "@/lib/admin-issues";
import type { AdminSystemInfo } from "@/lib/admin-system-info";
import { DEV_BACKEND_ORIGIN } from "@/lib/api-base";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "general", label: "General" },
  { id: "system", label: "System" },
  { id: "issues", label: "Issues" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}

function StatCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-ink-900/50 p-4">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-medium ${warn ? "text-amber-300" : "text-zinc-50"}`}>{value}</p>
    </div>
  );
}

function issueSeverityClass(severity: AdminIssue["severity"]): string {
  if (severity === "critical") return "border-red-900/60 bg-red-950/30 text-red-100";
  if (severity === "warning") return "border-amber-900/50 bg-amber-950/30 text-amber-100";
  return "border-zinc-800 bg-ink-900/50 text-zinc-200";
}

type DashboardPayload = {
  overview: AdminOverview | null;
  apiHealthy: boolean;
};

type Props = {
  initialOverview: AdminOverview | null;
  initialApiHealthy: boolean;
  systemInfo: AdminSystemInfo;
  ingestPanel: ReactNode;
};

export function AdminDashboardPanel({
  initialOverview,
  initialApiHealthy,
  systemInfo,
  ingestPanel,
}: Props) {
  const [tab, setTab] = useState<TabId>("overview");
  const [data, setData] = useState<DashboardPayload>(() => ({
    overview: initialOverview,
    apiHealthy: initialApiHealthy,
  }));
  const [loadError, setLoadError] = useState(false);
  const openApiDocs =
    process.env.NEXT_PUBLIC_BACKEND_DOCS_URL ?? `${DEV_BACKEND_ORIGIN}/docs`;

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/overview");
      if (!response.ok) {
        setLoadError(true);
        return;
      }
      const payload = (await response.json()) as DashboardPayload;
      setData((prev) => ({
        overview: payload.overview ?? prev.overview,
        apiHealthy: payload.apiHealthy,
      }));
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void load();

    function onRefresh() {
      void load();
    }
    window.addEventListener("jachai:admin-refresh", onRefresh);
    return () => window.removeEventListener("jachai:admin-refresh", onRefresh);
  }, [load]);

  const overview = data?.overview ?? null;
  const apiHealthy = data?.apiHealthy ?? false;

  useEffect(() => {
    setData({ overview: initialOverview, apiHealthy: initialApiHealthy });
    setLoadError(false);
  }, [initialOverview, initialApiHealthy]);

  const issues = useMemo(
    () =>
      collectAdminIssues({
        overview,
        apiHealthy,
        loadError,
        systemInfo,
      }),
    [overview, apiHealthy, loadError, systemInfo],
  );

  const issueCounts = useMemo(() => countIssuesBySeverity(issues), [issues]);

  const activeSources = overview?.sources.filter((s) => !s.disabled).length ?? 0;
  const disabledSources = overview?.sources.filter((s) => s.disabled).length ?? 0;

  function goToTab(next: TabId) {
    setTab(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-ink-900/50 p-1">
        {TABS.map((item) => {
          const showIssueBadge = item.id === "issues" && issues.length > 0;
          const badgeCritical = issueCounts.critical > 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                tab === item.id ? "bg-zinc-800 text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {item.label}
              {showIssueBadge ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                    badgeCritical ? "bg-red-900/80 text-red-100" : "bg-amber-900/60 text-amber-100"
                  }`}
                >
                  {issues.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="API"
              value={apiHealthy ? "Healthy" : "Unreachable"}
              warn={!apiHealthy}
            />
            <StatCard label="Articles" value={overview ? String(overview.articles_total) : "—"} />
            <StatCard label="Clusters" value={overview ? String(overview.clusters_total) : "—"} />
            <StatCard
              label="Open issues"
              value={String(issues.length)}
              warn={issueCounts.critical > 0 || issueCounts.warning > 0}
            />
          </section>

          {!overview ? (
            <p className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-200">
              Could not load admin overview from the API. Check{" "}
              <code className="text-amber-100">API_URL</code> /{" "}
              <code className="text-amber-100">ADMIN_API_KEY</code> and that the backend is running. See
              the Issues and System tabs for details.
            </p>
          ) : null}
          {loadError && overview ? (
            <p className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-200">
              Could not refresh stats from the API. Showing the last loaded snapshot.
            </p>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => goToTab("general")}
              className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5 text-left text-sm text-zinc-300 transition hover:border-zinc-700"
            >
              <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">General</h2>
              <p className="mt-2 text-zinc-100">
                {activeSources} active RSS source{activeSources === 1 ? "" : "s"}
                {disabledSources > 0 ? ` · ${disabledSources} disabled` : ""}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Add/remove feeds and run manual ingest.</p>
            </button>
            <button
              type="button"
              onClick={() => goToTab("system")}
              className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5 text-left text-sm text-zinc-300 transition hover:border-zinc-700"
            >
              <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">System</h2>
              <p className="mt-2 text-zinc-100">
                {overview ? `AI: ${overview.ai_provider}` : "Pipeline unknown"}
                {overview
                  ? ` · Groq ${overview.groq_configured ? "ok" : "missing"} · Gemini ${overview.gemini_configured ? "ok" : "missing"}`
                  : null}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Env: {systemInfo.nodeEnv} · Supabase {systemInfo.supabaseConfigured ? "on" : "off"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => goToTab("issues")}
              className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5 text-left text-sm text-zinc-300 transition hover:border-zinc-700"
            >
              <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Issues</h2>
              <p className="mt-2 text-zinc-100">
                {issues.length === 0
                  ? "Nothing flagged"
                  : `${issueCounts.critical} critical · ${issueCounts.warning} warning · ${issueCounts.info} info`}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Action items for ops and configuration.</p>
            </button>
          </section>

          {overview ? (
            <section>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-500">
                Recent clusters
              </h2>
              <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
                {overview.recent_clusters.map((cluster) => (
                  <li key={cluster.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <Link href={`/story/${cluster.slug}`} className="text-zinc-100 hover:text-accent">
                        {cluster.title}
                      </Link>
                      <p className="text-xs text-zinc-500">{formatWhen(cluster.created_at)}</p>
                    </div>
                    <span className="text-xs text-zinc-400">{cluster.article_count} articles</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "general" ? (
        <div className="space-y-8">
          <ClientErrorBoundary title="Sources panel could not load">
            <AdminSourcesPanel sources={overview?.sources ?? []} />
          </ClientErrorBoundary>
          {ingestPanel}
        </div>
      ) : null}

      {tab === "system" ? (
        <div className="space-y-6">
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5 text-sm text-zinc-300">
              <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Web app</h2>
              <ul className="mt-3 space-y-2">
                <li>
                  Node env: <span className="text-zinc-100">{systemInfo.nodeEnv}</span>
                </li>
                <li>
                  Public API base: <code className="text-zinc-100">{systemInfo.publicApiBase}</code>
                </li>
                <li>
                  Server API base: <code className="text-zinc-100">{systemInfo.serverApiBase}</code>
                  {systemInfo.serverApiUrlOverridden ? " (API_URL override)" : " (default dev)"}
                </li>
                <li>Supabase auth: {systemInfo.supabaseConfigured ? "configured" : "not configured"}</li>
                <li>Mock Pro (local): {systemInfo.mockProEnabled ? "enabled" : "off"}</li>
                <li>
                  Frontend admin key: {systemInfo.adminApiKeyConfigured ? "set" : "not set"}
                </li>
                <li>
                  Frontend ingest key: {systemInfo.ingestApiKeyConfigured ? "set" : "not set"}
                </li>
                <li>
                  API health:{" "}
                  <span className={apiHealthy ? "text-emerald-300" : "text-amber-300"}>
                    {apiHealthy ? "healthy" : "unreachable"}
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5 text-sm text-zinc-300">
              <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Backend pipeline</h2>
              {overview ? (
                <ul className="mt-3 space-y-2">
                  <li>
                    AI provider: <span className="text-zinc-100">{overview.ai_provider}</span>
                  </li>
                  <li>Groq key: {overview.groq_configured ? "set" : "missing"}</li>
                  <li>Gemini key: {overview.gemini_configured ? "set" : "missing"}</li>
                  <li>Ingest API key (backend): {overview.ingest_key_configured ? "required" : "open"}</li>
                  <li>Articles total: {overview.articles_total}</li>
                  <li>Clusters total: {overview.clusters_total}</li>
                  <li>Sources total: {overview.sources_total}</li>
                  <li>Rumor flags: {overview.rumors_total}</li>
                  <li>Latest article: {formatWhen(overview.latest_article_at)}</li>
                  <li>Latest cluster: {formatWhen(overview.latest_cluster_at)}</li>
                </ul>
              ) : (
                <p className="mt-3 text-zinc-500">Load overview from the API to see pipeline stats.</p>
              )}
            </div>
          </section>
          <section className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5 text-sm text-zinc-300">
            <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Links</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <a className="text-accent hover:underline" href={openApiDocs}>
                  OpenAPI docs
                </a>
              </li>
              <li>
                <Link className="text-accent hover:underline" href="/browse">
                  Public browse
                </Link>
              </li>
            </ul>
          </section>
        </div>
      ) : null}

      {tab === "issues" ? (
        <div className="space-y-4">
          {issues.length === 0 ? (
            <p className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 text-sm text-emerald-100">
              No issues detected from current API health, overview, and frontend configuration.
            </p>
          ) : (
            <ul className="space-y-3">
              {issues.map((issue) => (
                <li
                  key={issue.id}
                  className={`rounded-xl border p-4 text-sm ${issueSeverityClass(issue.severity)}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">{issue.title}</p>
                    <span className="text-[10px] uppercase tracking-widest opacity-70">{issue.severity}</span>
                  </div>
                  <p className="mt-2 opacity-90">{issue.detail}</p>
                  <button
                    type="button"
                    onClick={() => goToTab(issue.relatedTab === "overview" ? "overview" : issue.relatedTab)}
                    className="mt-3 text-xs text-accent hover:underline"
                  >
                    Open {issue.relatedTab} tab
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
