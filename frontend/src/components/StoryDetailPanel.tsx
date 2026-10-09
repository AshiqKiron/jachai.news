"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { ApiDegradedBanner } from "@/components/ApiDegradedBanner";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { BlindspotBanner } from "@/components/BlindspotBanner";
import { AntiClickbaitSummaryPanel } from "@/components/AntiClickbaitSummaryPanel";
import { PartialityBanner } from "@/components/PartialityBanner";
import { PaywallModal } from "@/components/PaywallModal";
import { StoryDetailMetaBar } from "@/components/StoryDetailMetaBar";
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
import { clusterBiasScore } from "@/lib/partiality";
import { readingTopicIdForStory, recordStoryRead } from "@/lib/reading-history";

const StoryTabs = dynamic(
  () => import("@/components/StoryTabs").then((mod) => mod.StoryTabs),
  {
    loading: () => <div className="mt-6 h-64 animate-pulse rounded-xl bg-zinc-800/30" />,
  },
);

type ResolvedStory = { story: Story; fromApi: boolean };

type Props = {
  slug: string;
  /** Demo/SSR seed so the page is readable before client fetch + when API is offline. */
  initialStory?: Story | null;
};

export function StoryDetailPanel({ slug, initialStory = null }: Props) {
  const [resolved, setResolved] = useState<ResolvedStory | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [proKnown, setProKnown] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useLayoutEffect(() => {
    const cached = readStoryCache(slug);
    if (cached) {
      setResolved({ story: cached, fromApi: true });
    } else if (initialStory) {
      setResolved({ story: hydrateClientStory(initialStory), fromApi: false });
    } else {
      setResolved(null);
    }
    setNotFoundState(false);
    setFollowed(isStoryFollowed(slug));
  }, [slug, initialStory]);

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
      const titleBn = resolved?.story.titleBn;
      toggleStoryFollowed(storySlug, titleBn);
      setFollowed(isStoryFollowed(storySlug));
    },
    [resolved?.story.titleBn],
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

  useEffect(() => {
    if (!resolved?.story) return;
    const hydrated = applyBlindspotDetection(resolved.story);
    recordStoryRead({
      slug,
      titleBn: hydrated.titleBn,
      biasScore: clusterBiasScore(hydrated),
      topicId: readingTopicIdForStory(hydrated),
      ...(hydrated.isBlindspot &&
      hydrated.blindspotPerspective &&
      (hydrated.blindspotPerspective === "establishment" ||
        hydrated.blindspotPerspective === "opposition")
        ? {
            isBlindspot: true,
            blindspotPerspective: hydrated.blindspotPerspective as BlindspotAxisPerspective,
          }
        : {}),
    });
  }, [slug, resolved]);

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
  return (
    <>
      {fromApi && story.articles.length === 0 ? <ApiDegradedBanner compact /> : null}

      <header className="max-w-3xl space-y-5">
        <h1 lang="bn" className="page-title-lg story-title-bn">
          {story.titleBn}
        </h1>
        <p className="text-base leading-snug text-zinc-500">{story.title}</p>
        {summaryBullets.length > 0 ? (
          <AntiClickbaitSummaryPanel bullets={summaryBullets} className="max-w-3xl" />
        ) : story.summaryBn ? (
          <p className="text-sm leading-relaxed text-zinc-400">{story.summaryBn}</p>
        ) : null}
        <StoryDetailMetaBar
          story={story}
          slug={slug}
          shareTitle={story.title || story.titleBn}
          titleBn={story.titleBn}
          isPro={isPro}
          proKnown={proKnown}
          followed={followed}
          onToggleFollow={handleToggleFollow}
          onLockedClick={() => setPaywallOpen(true)}
        />
        {partiality || story.isBlindspot ? (
          <div className="space-y-2">
            {partiality ? <PartialityBanner analysis={partiality} comfortable /> : null}
            {story.isBlindspot &&
            story.blindspotPerspective &&
            (story.blindspotPerspective === "establishment" ||
              story.blindspotPerspective === "opposition") ? (
              <BlindspotBanner
                perspective={story.blindspotPerspective as BlindspotAxisPerspective}
                comfortable
              />
            ) : null}
          </div>
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
