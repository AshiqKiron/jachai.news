import Link from "next/link";
import { notFound } from "next/navigation";

import { CoverageBar } from "@/components/CoverageBar";
import { StoryTabs } from "@/components/StoryTabs";
import { enrichArticles } from "@/lib/coverage";
import { DEMO_STORIES, getStoryBySlug } from "@/lib/demo-data";
import { PERSPECTIVE_META } from "@/lib/perspectives";
import { fetchClusters } from "@/lib/api";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return DEMO_STORIES.map((story) => ({ slug: story.slug }));
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  let story = getStoryBySlug(slug);

  if (!story) {
    try {
      const data = await fetchClusters(50);
      const cluster = data.items.find((c) => c.slug === slug);
      if (cluster) {
        story = {
          slug: cluster.slug,
          title: cluster.title,
          titleBn: cluster.title,
          summary: cluster.summary ?? "",
          summaryBn: cluster.summary ?? "",
          category: "News",
          categoryBn: "সংবাদ",
          isBlindspot: false,
          perspectiveSummaries: {},
          articles: [],
          updatedAt: cluster.created_at,
        };
      }
    } catch {
      /* demo only */
    }
  }

  if (!story) notFound();

  const articles = enrichArticles(story);

  return (
    <div className="space-y-8 pb-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Top stories
      </Link>

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

      <StoryTabs story={story} articles={articles} />
    </div>
  );
}
