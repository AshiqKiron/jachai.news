import Link from "next/link";

import { ArticleImage } from "@/components/ArticleImage";
import { resolveArticleImageUrl, resolveStoryLeadImageUrl } from "@/lib/article-image-url";
import { blindspotBannerCopy, type BlindspotAxisPerspective } from "@/lib/blindspot";
import { CoverageBar } from "@/components/CoverageBar";
import { StoryPartialityTeaser } from "@/components/StoryPartialityTeaser";
import type { Story } from "@/lib/demo-data";

type Props = {
  story: Story;
};

function blindspotAxis(story: Story): BlindspotAxisPerspective | null {
  if (!story.isBlindspot || !story.blindspotPerspective) return null;
  if (
    story.blindspotPerspective === "establishment" ||
    story.blindspotPerspective === "opposition"
  ) {
    return story.blindspotPerspective;
  }
  return null;
}

export function StoryFeedCard({ story }: Props) {
  const axis = blindspotAxis(story);
  const blindspotCopy = axis ? blindspotBannerCopy(axis) : null;
  const leadImage = resolveStoryLeadImageUrl(story);

  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-800/90 bg-ink-900/70 shadow-lg shadow-black/25 transition hover:border-zinc-700">
      <Link href={`/story/${story.slug}`} className="block">
        <ArticleImage
          src={leadImage}
          alt=""
          className="aspect-[2/1] w-full object-cover transition group-hover:opacity-95"
        />
      </Link>
      <div className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <p className="min-w-0 text-xs font-medium uppercase tracking-widest text-zinc-500">
          {story.categoryBn} · {story.articles.length}{" "}
          {story.articles.length === 1 ? "source" : "sources"} · {story.articles.length} উৎস
        </p>
        {blindspotCopy ? (
          <span
            className="w-fit max-w-full shrink-0 self-start rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold leading-tight text-amber-300 sm:max-w-[55%] sm:self-auto sm:text-right"
            title={blindspotCopy.detailEn}
          >
            {blindspotCopy.titleBn}
          </span>
        ) : null}
      </div>
      <h2 className="mt-2 break-words font-display text-lg leading-snug text-zinc-50 group-hover:text-white sm:text-xl">
        <Link href={`/story/${story.slug}`}>{story.titleBn}</Link>
      </h2>
      <p className="mt-1 text-sm text-zinc-500 line-clamp-1">{story.title}</p>
      <p className="mt-3 text-sm text-zinc-400 line-clamp-2">{story.summaryBn}</p>
      <div className="relative z-10 mt-4 overflow-visible">
        <CoverageBar story={story} compact />
      </div>
      <div className="relative z-10">
        <StoryPartialityTeaser story={story} />
      </div>
      </div>
    </article>
  );
}
