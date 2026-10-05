import Link from "next/link";

import { ArticleImage } from "@/components/ArticleImage";
import { resolveArticleImageUrl } from "@/lib/article-image-url";
import { ApiDegradedBanner } from "@/components/ApiDegradedBanner";
import { RumorBadge } from "@/components/RumorBadge";
import { getRumorsFeed } from "@/lib/stories";

export const revalidate = 120;

export default async function RumorsPage() {
  const { items, fromApi } = await getRumorsFeed(30);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="page-title">Rumor watch</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Stories with low corroboration or explicitly speculative framing. Treat as unverified until sources converge.
        </p>
        <Link href="/verify" className="mt-3 inline-block text-sm text-accent hover:underline">
          Submit a claim for verification →
        </Link>
        {!fromApi ? <div className="mt-4"><ApiDegradedBanner compact /></div> : null}
      </header>

      <ul className="space-y-4">
        {items.length === 0 ? (
          <li className="rounded-xl border border-dashed border-zinc-800 p-8 text-sm text-zinc-500">
            No flagged rumors in the index.
          </li>
        ) : (
          items.map((article) => (
            <li key={article.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-ink-900/40">
              <a href={article.url} target="_blank" rel="noreferrer" className="block">
                <ArticleImage
                  src={resolveArticleImageUrl(article.image_url)}
                  alt=""
                  className="aspect-[2/1] w-full object-cover"
                />
              </a>
              <div className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <RumorBadge />
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-words text-base font-medium text-zinc-100 sm:text-lg"
                  >
                    {article.title}
                  </a>
                </div>
                {article.excerpt ? <p className="mt-2 text-sm text-zinc-500">{article.excerpt}</p> : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
