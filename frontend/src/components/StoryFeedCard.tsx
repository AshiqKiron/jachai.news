import Link from "next/link";

import { ArticleImage } from "@/components/ArticleImage";
import { headlineEdits } from "@/lib/first-headline";
import { BlindspotBanner } from "@/components/BlindspotBanner";
import { resolveStoryLeadImageUrl } from "@/lib/article-image-url";
import { type BlindspotAxisPerspective } from "@/lib/blindspot";
import { CoverageBar } from "@/components/CoverageBar";
import { WalkbackPin } from "@/components/WalkbackPin";
import { StoryFollowButton } from "@/components/StoryFollowButton";
import { StoryPartialityTeaser } from "@/components/StoryPartialityTeaser";
import type { Story } from "@/lib/demo-data";
import { hasBengaliScript, storySubtitle } from "@/lib/mixed-script-text";
import { coverageSpectrumModeForStory, topicMetaForStory } from "@/lib/story-topics";
import { latestRemovalLineEn } from "@/lib/taken-down";
import { walkbackForStory } from "@/lib/walkback-line";

type StoryFeedCardVariant = "default" | "home";

type Props = {
  story: Story;
  variant?: StoryFeedCardVariant;
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

function homeCardSummary(story: Story): string {
  if (story.summaryBullets?.length) {
    return story.summaryBullets.slice(0, 2).join(" ");
  }
  return story.summaryBn;
}

export function StoryFeedCard({
  story,
  variant = "default",
  isPro = false,
  proKnown = false,
  followed = false,
  onToggleFollow,
  onFollowLocked,
}: Props) {
  const axis = coverageSpectrumModeForStory(story) === "government" ? blindspotAxis(story) : null;
  const leadImage = resolveStoryLeadImageUrl(story);
  const topic = topicMetaForStory(story);
  const showFollow = Boolean(onToggleFollow && onFollowLocked);
  const isHome = variant === "home";
  const sourceCount = story.articles.length;
  const subtitle = storySubtitle(story.title, story.titleBn);
  const firstEdit = headlineEdits(story.articles)[0];
  const walkback = walkbackForStory(story);
  const removedLine = latestRemovalLineEn(story.articles);

  return (
    <article
      className={
        isHome
          ? "group overflow-hidden rounded-xl border border-zinc-800/80 bg-ink-900/50 transition hover:border-zinc-700/90"
          : "group overflow-hidden rounded-2xl border border-zinc-800/90 bg-ink-900/70 shadow-lg shadow-black/25 transition hover:border-zinc-700"
      }
    >
      <Link href={`/story/${story.slug}`} className="block">
        <ArticleImage
          src={leadImage}
          alt=""
          className={
            isHome
              ? "aspect-[16/9] w-full object-cover transition group-hover:opacity-95"
              : "aspect-[2/1] w-full object-cover transition group-hover:opacity-95"
          }
        />
      </Link>
      <div className={isHome ? "p-4" : "p-5"}>
      {walkback ? (
        <WalkbackPin sentence={walkback.sentence} sourceName={null} compact />
      ) : null}
      <div
        className={`flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 ${walkback ? "mt-2" : ""}`}
      >
        {isHome ? (
          <p className="min-w-0 font-bengali text-xs text-zinc-500">
            {topic.labelBn}
            <span className="text-zinc-600">
              {" "}
              · {sourceCount} উৎস
              {axis ? (
                <>
                  {" "}
                  · <span className="text-amber-600/90 dark:text-amber-500/90">ব্লাইন্ডস্পট</span>
                </>
              ) : null}
            </span>
          </p>
        ) : (
          <p className="min-w-0 text-xs font-medium uppercase tracking-widest text-zinc-500">
            <span className="font-bengali normal-case">{topic.labelBn}</span> · {topic.labelEn} ·{" "}
            {sourceCount} {sourceCount === 1 ? "source" : "sources"} · {sourceCount} উৎস
          </p>
        )}
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
      {removedLine ? (
        <p className={`${isHome ? "mt-2" : "mt-3"} text-sm font-medium leading-snug text-amber-800 dark:text-amber-100`}>
          <span className="font-bengali font-semibold">সরিয়ে নেওয়া হয়েছে</span>
          <span className="text-amber-900/80 dark:text-amber-100/75"> · {removedLine}</span>
        </p>
      ) : null}
      <h2
        lang={hasBengaliScript(story.titleBn) ? "bn" : "en"}
        className={
          isHome
            ? "story-title-bn mt-1.5 text-base leading-snug text-zinc-100 group-hover:text-white sm:text-lg"
            : "story-title-bn mt-2 text-lg leading-snug text-zinc-50 group-hover:text-white sm:text-xl"
        }
      >
        <Link href={`/story/${story.slug}`}>{story.titleBn}</Link>
      </h2>
      {firstEdit ? (
        <div className="mt-2 rounded-lg border border-rose-300/70 bg-rose-50 px-2.5 py-2 dark:border-rose-400/25 dark:bg-rose-500/10">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-800 dark:text-rose-200">
            <span className="font-bengali normal-case tracking-normal">প্রথম শিরোনাম</span>
            {firstEdit.clock ? <span className="font-bengali normal-case"> · {firstEdit.clock.bn}</span> : null}
            <span className="font-bengali normal-case">
              {" "}
              · {firstEdit.correctionNoted ? "সংশোধনী আছে" : "সংশোধনী নেই"}
            </span>
          </p>
          <p className="story-title-bn mt-1 line-clamp-2 text-sm leading-snug text-rose-950 dark:text-rose-50">
            {firstEdit.originalHeadline}
          </p>
          <p className="story-title-bn line-clamp-2 text-sm leading-snug text-zinc-600 dark:text-zinc-400">
            {firstEdit.currentHeadline}
          </p>
        </div>
      ) : null}
      {!isHome && subtitle ? (
        <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{subtitle}</p>
      ) : null}
      {isHome ? (
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 line-clamp-2">{homeCardSummary(story)}</p>
      ) : story.summaryBullets && story.summaryBullets.length > 0 ? (
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
      <div className={`relative z-10 overflow-visible ${isHome ? "mt-3" : "mt-4"}`}>
        <CoverageBar story={story} compact />
      </div>
      {!isHome && axis ? (
        <div className="relative z-10 mt-3">
          <BlindspotBanner perspective={axis} compact />
        </div>
      ) : null}
      {!isHome ? (
        <div className="relative z-10">
          <StoryPartialityTeaser story={story} />
        </div>
      ) : null}
      </div>
    </article>
  );
}
