import Link from "next/link";

import { ArticleImage } from "@/components/ArticleImage";
import { resolveArticleImageUrl } from "@/lib/article-image-url";
import { ApiDegradedBanner } from "@/components/ApiDegradedBanner";
import { StoryFeedCard } from "@/components/StoryFeedCard";
import { DEMO_STORIES } from "@/lib/demo-data";
import { getBrowseClusters, getLatestArticlesFeed } from "@/lib/stories";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ cluster?: string }>;
}) {
  const { cluster: clusterSlug } = await searchParams;

  const [articlesFeed, clustersFeed] = await Promise.all([getLatestArticlesFeed(24), getBrowseClusters(24)]);

  const { stories, fromApi: clustersFromApi } = clustersFeed;
  const { items: articleItems, fromApi: articlesFromApi } = articlesFeed;
  const demoBySlug = new Map(DEMO_STORIES.map((s) => [s.slug, s]));
  const activeStory = clusterSlug ? stories.find((s) => s.slug === clusterSlug) ?? demoBySlug.get(clusterSlug) : undefined;

  return (
    <div className="space-y-8 pb-4">
      <header>
        <h1 className="page-title">Browse</h1>
        <p className="mt-2 text-zinc-400">Story clusters and latest ingested articles.</p>
        {!clustersFromApi || !articlesFromApi ? (
          <div className="mt-4">
            <ApiDegradedBanner compact />
          </div>
        ) : null}
      </header>

      {activeStory ? (
        <section className="rounded-xl border border-zinc-800 bg-ink-900/50 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Selected story</p>
          <h2 lang="bn" className="story-title-bn mt-1 text-xl font-semibold leading-snug">
            {activeStory.titleBn}
          </h2>
          <Link href={`/story/${activeStory.slug}`} className="mt-3 inline-block text-sm text-accent">
            Open full coverage →
          </Link>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-500">Clusters</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((story) => (
            <StoryFeedCard key={story.slug} story={story} />
          ))}
        </div>
      </section>

      {articleItems.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-500">Latest articles (API)</h2>
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {articleItems.map((article) => (
              <li key={article.id} className="px-4 py-3">
                <div className="flex gap-3">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 overflow-hidden rounded-lg"
                  >
                    <ArticleImage
                      src={resolveArticleImageUrl(article.image_url)}
                      alt=""
                      className="h-16 w-24 object-cover"
                    />
                  </a>
                  <div className="min-w-0 flex-1">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-zinc-100"
                    >
                      {article.title}
                    </a>
                    {article.excerpt ? (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{article.excerpt}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
