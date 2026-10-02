import Link from "next/link";

import { StoryFeedCard } from "@/components/StoryFeedCard";
import { DEMO_STORIES, type Story } from "@/lib/demo-data";
import { fetchArticles, fetchClusters } from "@/lib/api";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ cluster?: string }>;
}) {
  const { cluster: clusterSlug } = await searchParams;
  const [articlesData, clustersData] = await Promise.all([
    fetchArticles(24).catch(() => ({ items: [], total: 0 })),
    fetchClusters(24).catch(() => ({ items: [], total: 0 })),
  ]);

  const demoBySlug = new Map(DEMO_STORIES.map((s) => [s.slug, s]));
  const stories: Story[] =
    clustersData.items.length > 0
      ? clustersData.items.map((c) => demoBySlug.get(c.slug)).filter((s): s is Story => Boolean(s))
      : DEMO_STORIES;

  const activeStory = clusterSlug ? demoBySlug.get(clusterSlug) : undefined;

  return (
    <div className="space-y-8 pb-4">
      <header>
        <h1 className="font-display text-3xl text-zinc-50">Browse</h1>
        <p className="mt-2 text-zinc-400">Story clusters and latest ingested articles.</p>
      </header>

      {activeStory ? (
        <section className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Selected story</p>
          <h2 className="mt-1 font-display text-xl">{activeStory.titleBn}</h2>
          <Link href={`/story/${activeStory.slug}`} className="mt-3 inline-block text-sm text-accent">
            Open full coverage →
          </Link>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-500">Clusters</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(stories.length ? stories : DEMO_STORIES).map((story) => (
            <StoryFeedCard key={story.slug} story={story} />
          ))}
        </div>
      </section>

      {articlesData.items.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-500">Latest articles (API)</h2>
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {articlesData.items.map((article) => (
              <li key={article.id} className="px-4 py-3">
                <a href={article.url} target="_blank" rel="noreferrer" className="font-medium text-zinc-100">
                  {article.title}
                </a>
                {article.excerpt && <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{article.excerpt}</p>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
