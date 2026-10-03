import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiDegradedBanner } from "@/components/ApiDegradedBanner";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { CoverageBar } from "@/components/CoverageBar";
import { StoryTabs } from "@/components/StoryTabs";
import { enrichArticles } from "@/lib/coverage";
import { DEMO_STORIES } from "@/lib/demo-data";
import { PERSPECTIVE_META } from "@/lib/perspectives";
import { resolveStoryBySlug } from "@/lib/stories";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return DEMO_STORIES.map((story) => ({ slug: story.slug }));
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveStoryBySlug(slug);

  if (!resolved) notFound();

  const { story, fromApi } = resolved;
  const articles = enrichArticles(story);

  return (
    <div className="space-y-8 pb-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Top stories
      </Link>

      {fromApi && story.articles.length === 0 ? (
        <ApiDegradedBanner compact />
      ) : null}

      <header className="max-w-3xl space-y-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          {story.categoryBn} · Full coverage
        </p>
        <h1 className="font-display text-3xl leading-tight text-zinc-50 md:text-4xl">{story.titleBn}</h1>
        <p className="text-lg text-zinc-400">{story.title}</p>
        <p className="text-sm leading-relaxed text-zinc-400">{story.summaryBn}</p>
        <CoverageBar story={story} />
        {story.isBlindspot && story.blindspotPerspective ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Blindspot: mostly covered from{" "}
            <strong>{PERSPECTIVE_META[story.blindspotPerspective].labelBn}</strong> angles — other perspectives
            underrepresented.
          </p>
        ) : null}
      </header>

      <ClientErrorBoundary title="Story coverage could not load">
        <StoryTabs story={story} articles={articles} />
      </ClientErrorBoundary>
    </div>
  );
}
