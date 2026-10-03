import Link from "next/link";

import { StoryDetailPanel } from "@/components/StoryDetailPanel";
import { DEMO_STORIES } from "@/lib/demo-data";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return DEMO_STORIES.map((story) => ({ slug: story.slug }));
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div className="space-y-8 pb-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Top stories
      </Link>
      <StoryDetailPanel key={slug} slug={slug} />
    </div>
  );
}
