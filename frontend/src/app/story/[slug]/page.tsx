import type { Metadata } from "next";
import Link from "next/link";

import { StoryDetailPanel } from "@/components/StoryDetailPanel";
import { DEMO_STORIES, getStoryBySlug } from "@/lib/demo-data";
import { applySourceDerivedSummaries } from "@/lib/source-digest";
import { buildStoryShareOpenGraph } from "@/lib/story-share";
import { resolveStoryBySlug } from "@/lib/stories";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveStoryBySlug(slug);
  if (!resolved) {
    return { title: "Story not found · Shorup News" };
  }

  const story = applySourceDerivedSummaries(resolved.story);
  const og = buildStoryShareOpenGraph(story, slug);

  const openGraphImages = og.imageUrl
    ? [{ url: og.imageUrl, width: 1200, height: 630, alt: og.title }]
    : undefined;

  return {
    title: `${og.title} · Shorup News`,
    description: og.description,
    openGraph: {
      type: "article",
      url: og.pageUrl,
      title: og.title,
      description: og.description,
      siteName: "Shorup News",
      images: openGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title: og.title,
      description: og.description,
      images: openGraphImages?.map((img) => img.url),
    },
  };
}

export async function generateStaticParams() {
  return DEMO_STORIES.map((story) => ({ slug: story.slug }));
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const demoSeed = getStoryBySlug(slug);
  const initialStory = demoSeed ? applySourceDerivedSummaries(demoSeed) : null;

  return (
    <div className="space-y-8 pb-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Top stories
      </Link>
      <StoryDetailPanel key={slug} slug={slug} initialStory={initialStory} />
    </div>
  );
}
