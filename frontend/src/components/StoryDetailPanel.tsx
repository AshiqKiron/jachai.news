"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { ApiDegradedBanner } from "@/components/ApiDegradedBanner";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { BlindspotBanner } from "@/components/BlindspotBanner";
import { CoverageBar } from "@/components/CoverageBar";
import { AntiClickbaitSummaryPanel } from "@/components/AntiClickbaitSummaryPanel";
import { PartialityBanner } from "@/components/PartialityBanner";
import { StoryCoverageDetails } from "@/components/StoryCoverageDetails";
import { PaywallModal } from "@/components/PaywallModal";
import { StoryFollowButton } from "@/components/StoryFollowButton";
import { StoryShareBar } from "@/components/StoryShareBar";
import { applyBlindspotDetection, type BlindspotAxisPerspective } from "@/lib/blindspot";
import { analyzePartiality } from "@/lib/partiality";
import type { Story } from "@/lib/demo-data";
import {
  readStoryCache,
  storyFingerprint,
  writeStoryCache,
} from "@/lib/client-story-cache";
import { hydrateClientStory } from "@/lib/client-story-hydrate";
import { enrichArticles } from "@/lib/coverage";
import { isStoryFollowed, toggleStoryFollowed } from "@/lib/followed-stories";
import { topicMetaForStory } from "@/lib/story-topics";

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
  const [isPro, setIsPro] = useState(false);
  const [proKnown, setProKnown] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useLayoutEffect(() => {
    const cached = readStoryCache(slug);
    setResolved(cached ? { story: cached, fromApi: true } : null);
    setNotFoundState(false);
    setFollowed(isStoryFollowed(slug));
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/me/pro");
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as { isPro?: boolean };
        if (cancelled) return;
        setIsPro(Boolean(payload.isPro));
      } catch {
        /* non-Pro */
      } finally {
        if (!cancelled) setProKnown(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleFollow = useCallback(
    (storySlug: string) => {
      toggleStoryFollowed(storySlug);
      setFollowed(isStoryFollowed(storySlug));
    },
    [],
  );

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

        const story = hydrateClientStory(payload.story);
        writeStoryCache(story);
        setResolved((prev) => {
          const next = { ...payload, story };
          if (prev && storyFingerprint(prev.story) === storyFingerprint(story)) {
            return prev.story.titleBn === story.titleBn ? prev : next;
          }
          return next;
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
  const partiality = analyzePartiality(story);
  const articles = enrichArticles(story);
  const summaryBullets = story.summaryBullets ?? [];
  const topic = topicMetaForStory(story);

  return (
    <>
      {fromApi && story.articles.length === 0 ? <ApiDegradedBanner compact /> : null}

      <header className="max-w-3xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            <span className="font-bengali normal-case">{topic.labelBn}</span> · {topic.labelEn} ·
            Full coverage
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <StoryFollowButton
              slug={slug}
              titleBn={story.titleBn}
              isPro={isPro}
              proKnown={proKnown}
              followed={followed}
              onToggleFollow={handleToggleFollow}
              onLockedClick={() => setPaywallOpen(true)}
            />
            <StoryShareBar slug={slug} shareTitle={story.title || story.titleBn} />
          </div>
        </div>
        <h1 lang="bn" className="page-title-lg story-title-bn">
          {story.titleBn}
        </h1>
        <p className="text-lg text-zinc-400">{story.title}</p>
        {summaryBullets.length > 0 ? (
          <AntiClickbaitSummaryPanel bullets={summaryBullets} className="max-w-3xl" />
        ) : story.summaryBn ? (
          <p className="text-sm leading-relaxed text-zinc-400">{story.summaryBn}</p>
        ) : null}
        <CoverageBar story={story} />
        {story.articles.length > 0 ? (
          <StoryCoverageDetails story={story} />
        ) : null}
        {partiality ? <PartialityBanner analysis={partiality} /> : null}
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
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        featureId="follow_story"
      />
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
