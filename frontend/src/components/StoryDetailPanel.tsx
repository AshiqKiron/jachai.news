"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

import { ApiDegradedBanner } from "@/components/ApiDegradedBanner";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { BlindspotBanner } from "@/components/BlindspotBanner";
import { CoverageBar } from "@/components/CoverageBar";
import { applyBlindspotDetection, type BlindspotAxisPerspective } from "@/lib/blindspot";
import type { Story } from "@/lib/demo-data";
import {
  readStoryCache,
  storyFingerprint,
  writeStoryCache,
} from "@/lib/client-story-cache";
import { enrichArticles } from "@/lib/coverage";

const StoryTabs = dynamic(
  () => import("@/components/StoryTabs").then((mod) => mod.StoryTabs),
  {
    loading: () => <div className="mt-6 h-64 animate-pulse rounded-xl bg-zinc-800/30" />,
  },
);

type ResolvedStory = { story: Story; fromApi: boolean };

type Props = {
  slug: string;
};

export function StoryDetailPanel({ slug }: Props) {
  const [resolved, setResolved] = useState<ResolvedStory | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);

  useLayoutEffect(() => {
    const cached = readStoryCache(slug);
    setResolved(cached ? { story: cached, fromApi: true } : null);
    setNotFoundState(false);
  }, [slug]);

  useEffect(() => {
    const cached = readStoryCache(slug);

    let cancelled = false;

    void (async () => {
      try {
        const etag = cached ? `"${storyFingerprint(cached)}"` : null;
        const response = await fetch(`/api/story/${encodeURIComponent(slug)}`, {
          headers: etag ? { "If-None-Match": etag } : undefined,
        });

        if (cancelled) return;

        if (response.status === 404) {
          if (!cached) setNotFoundState(true);
          return;
        }

        if (response.status === 304) {
          if (cached) writeStoryCache(cached);
          return;
        }

        if (!response.ok) return;

        const payload = (await response.json()) as ResolvedStory;
        if (cancelled || !payload.story) return;

        writeStoryCache(payload.story);
        setResolved((prev) => {
          if (prev && storyFingerprint(prev.story) === storyFingerprint(payload.story)) {
            return prev;
          }
          return payload;
        });
      } catch {
        /* keep cached / skeleton */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFoundState) {
    notFound();
  }

  if (!resolved) {
    return <StoryDetailSkeleton />;
  }

  const { fromApi } = resolved;
  const story = applyBlindspotDetection(resolved.story);
  const articles = enrichArticles(story);

  return (
    <>
      {fromApi && story.articles.length === 0 ? <ApiDegradedBanner compact /> : null}

      <header className="max-w-3xl space-y-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          {story.categoryBn} · Full coverage
        </p>
        <h1 className="page-title-lg break-words">{story.titleBn}</h1>
        <p className="text-lg text-zinc-400">{story.title}</p>
        <p className="text-sm leading-relaxed text-zinc-400">{story.summaryBn}</p>
        <CoverageBar story={story} />
        {story.isBlindspot &&
        story.blindspotPerspective &&
        (story.blindspotPerspective === "establishment" ||
          story.blindspotPerspective === "opposition") ? (
          <BlindspotBanner perspective={story.blindspotPerspective as BlindspotAxisPerspective} />
        ) : null}
      </header>

      <ClientErrorBoundary title="Story coverage could not load">
        <StoryTabs story={story} articles={articles} />
      </ClientErrorBoundary>
    </>
  );
}

function StoryDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <header className="max-w-3xl space-y-4">
        <div className="h-3 w-40 rounded bg-zinc-800" />
        <div className="h-10 w-full max-w-2xl rounded bg-zinc-800" />
        <div className="h-6 w-3/4 max-w-xl rounded bg-zinc-800/80" />
        <div className="h-16 w-full rounded bg-zinc-800/60" />
      </header>
      <div className="h-12 rounded-xl bg-zinc-800/40" />
    </div>
  );
}
