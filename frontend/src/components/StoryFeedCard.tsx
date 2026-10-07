import Link from "next/link";

import { ArticleImage } from "@/components/ArticleImage";
import { BlindspotBanner } from "@/components/BlindspotBanner";
import { resolveStoryLeadImageUrl } from "@/lib/article-image-url";
import { type BlindspotAxisPerspective } from "@/lib/blindspot";
import { CoverageBar } from "@/components/CoverageBar";
import { StoryFollowButton } from "@/components/StoryFollowButton";
import { StoryPartialityTeaser } from "@/components/StoryPartialityTeaser";
import type { Story } from "@/lib/demo-data";
import { topicMetaForStory } from "@/lib/story-topics";

type Props = {
  story: Story;
  isPro?: boolean;
  proKnown?: boolean;
  followed?: boolean;
  onToggleFollow?: (slug: string) => void;
  onFollowLocked?: () => void;
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

export function StoryFeedCard({
  story,
  isPro = false,
  proKnown = false,
  followed = false,
  onToggleFollow,
  onFollowLocked,
}: Props) {
  const axis = blindspotAxis(story);
  const leadImage = resolveStoryLeadImageUrl(story);
  const topic = topicMetaForStory(story);
  const showFollow = Boolean(onToggleFollow && onFollowLocked);

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
          <span className="font-bengali normal-case">{topic.labelBn}</span> · {topic.labelEn} ·{" "}
          {story.articles.length} {story.articles.length === 1 ? "source" : "sources"} ·{" "}
          {story.articles.length} উৎস
        </p>
        {showFollow ? (
          <StoryFollowButton
            slug={story.slug}
            titleBn={story.titleBn}
            isPro={isPro}
            proKnown={proKnown}
            followed={followed}
            onToggleFollow={onToggleFollow!}
            onLockedClick={onFollowLocked!}
            compact
          />
        ) : null}
      </div>
      <h2 className="mt-2 break-words font-display text-lg leading-snug text-zinc-50 group-hover:text-white sm:text-xl">
        <Link href={`/story/${story.slug}`}>{story.titleBn}</Link>
      </h2>
      <p className="mt-1 text-sm text-zinc-500 line-clamp-1">{story.title}</p>
      {story.summaryBullets && story.summaryBullets.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-400 marker:text-zinc-600 line-clamp-[4]">
          {story.summaryBullets.map((bullet) => (
            <li key={bullet.slice(0, 40)} className="line-clamp-1">
              {bullet}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-zinc-400 line-clamp-2">{story.summaryBn}</p>
      )}
      <div className="relative z-10 mt-4 overflow-visible">
        <CoverageBar story={story} compact />
      </div>
      {axis ? (
        <div className="relative z-10 mt-3">
          <BlindspotBanner perspective={axis} compact />
        </div>
      ) : null}
      <div className="relative z-10">
        <StoryPartialityTeaser story={story} />
      </div>
      </div>
    </article>
  );
}
