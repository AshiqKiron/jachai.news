"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminSourcesPanel } from "@/components/AdminSourcesPanel";
import { ApiDegradedBanner } from "@/components/ApiDegradedBanner";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import type { AdminOverview } from "@/lib/admin-api";
import type { CustomSourceFeedBlock } from "@/lib/stories";

type FeedPayload = {
  blocks?: CustomSourceFeedBlock[];
  fromApi?: boolean;
};

type OverviewPayload = {
  overview: AdminOverview | null;
};

export function HomeCustomSourceFeedsClient() {
  const [blocks, setBlocks] = useState<CustomSourceFeedBlock[]>([]);
  const [fromApi, setFromApi] = useState(true);
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);
  const [manageChecked, setManageChecked] = useState(false);

  const loadFeedBlocks = useCallback(async () => {
    try {
      const response = await fetch("/api/feed/custom-sources", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as FeedPayload;
      setBlocks(payload.blocks ?? []);
      setFromApi(payload.fromApi ?? false);
    } catch {
      setBlocks([]);
      setFromApi(false);
    }
  }, []);

  const loadAdminOverview = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/overview");
      if (!response.ok) {
        setAdminOverview(null);
        return;
      }
      const payload = (await response.json()) as OverviewPayload;
      setAdminOverview(payload.overview);
    } catch {
      setAdminOverview(null);
    } finally {
      setManageChecked(true);
    }
  }, []);

  useEffect(() => {
    void loadFeedBlocks();
    void loadAdminOverview();

    function onRefresh() {
      void loadFeedBlocks();
      void loadAdminOverview();
    }

    window.addEventListener("jachai:custom-feeds-refresh", onRefresh);
    window.addEventListener("jachai:admin-refresh", onRefresh);
    return () => {
      window.removeEventListener("jachai:custom-feeds-refresh", onRefresh);
      window.removeEventListener("jachai:admin-refresh", onRefresh);
    };
  }, [loadFeedBlocks, loadAdminOverview]);

  const canManage = adminOverview !== null;

  if (blocks.length === 0) {
    if (!manageChecked) return null;
    if (!canManage) return null;
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Custom RSS feeds
          <span className="ml-2 font-normal normal-case tracking-normal text-zinc-600">
            · হোমপেজে আপনার ফিড
          </span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Add outlets beyond the default Bangladesh cluster list. Headlines from each feed show up here after
          ingest.
        </p>
      </div>

      {canManage ? (
        <ClientErrorBoundary title="RSS management could not load">
          <AdminSourcesPanel
            variant="home"
            sources={adminOverview?.sources ?? []}
            onFeedsChanged={() => {
              void loadFeedBlocks();
            }}
          />
        </ClientErrorBoundary>
      ) : null}

      {blocks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
          {canManage
            ? "No headlines yet — add a feed above, then run ingest from Admin."
            : "No custom feed headlines yet."}
        </p>
      ) : (
        <>
          {!fromApi ? <ApiDegradedBanner compact /> : null}
          {blocks.map(({ source, articles }) => (
            <div key={source.source_id}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-medium text-zinc-200">{source.name}</h3>
              </div>
              <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-ink-900/40">
                {articles.map((article) => (
                  <li key={article.id} className="px-4 py-3">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-zinc-100 hover:text-white"
                    >
                      {article.title}
                    </a>
                    {article.excerpt ? (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{article.excerpt}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
