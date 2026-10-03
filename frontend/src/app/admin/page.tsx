import Link from "next/link";

import { AdminIngestPanel } from "@/components/AdminIngestPanel";
import { AdminSourcesPanel } from "@/components/AdminSourcesPanel";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { fetchAdminOverview, fetchApiHealth } from "@/lib/admin-api";

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}

export default async function AdminPage() {
  const [overview, apiHealthy] = await Promise.all([fetchAdminOverview(), fetchApiHealth()]);
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">Internal</p>
          <h1 className="font-display text-3xl text-zinc-50">Operations</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Database stats, feed health, and manual RSS ingest.
          </p>
        </div>
        <AdminLogoutButton />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="API" value={apiHealthy ? "Healthy" : "Unreachable"} warn={!apiHealthy} />
        <StatCard label="Articles" value={overview ? String(overview.articles_total) : "—"} />
        <StatCard label="Clusters" value={overview ? String(overview.clusters_total) : "—"} />
        <StatCard label="Rumor flags" value={overview ? String(overview.rumors_total) : "—"} />
      </section>

      {overview ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5 text-sm text-zinc-300">
            <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Pipeline</h2>
            <ul className="mt-3 space-y-2">
              <li>AI provider: <span className="text-zinc-100">{overview.ai_provider}</span></li>
              <li>Groq key: {overview.groq_configured ? "set" : "missing"}</li>
              <li>Gemini key: {overview.gemini_configured ? "set" : "missing"}</li>
              <li>Ingest API key: {overview.ingest_key_configured ? "required" : "open"}</li>
              <li>Latest article: {formatWhen(overview.latest_article_at)}</li>
              <li>Latest cluster: {formatWhen(overview.latest_cluster_at)}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5 text-sm text-zinc-300">
            <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Links</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <a className="text-accent hover:underline" href={apiBase.replace(/\/api\/v1\/?$/, "/docs")}>
                  OpenAPI docs
                </a>
              </li>
              <li>
                <Link className="text-accent hover:underline" href="/browse">
                  Public browse
                </Link>
              </li>
            </ul>
          </div>
        </section>
      ) : (
        <p className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-200">
          Could not load admin overview from the API. Check{" "}
          <code className="text-amber-100">NEXT_PUBLIC_API_URL</code> and{" "}
          <code className="text-amber-100">ADMIN_API_KEY</code> on the frontend server.
        </p>
      )}

      <AdminIngestPanel />

      {overview ? (
        <>
          <AdminSourcesPanel sources={overview.sources} />

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
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-ink-900/50 p-4">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-medium ${warn ? "text-amber-300" : "text-zinc-50"}`}>{value}</p>
    </div>
  );
}
