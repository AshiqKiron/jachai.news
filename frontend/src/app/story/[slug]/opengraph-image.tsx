import { buildStoryShareCard, storyShareMarkCard } from "@/lib/story-share-card";
import { renderStoryShareCard } from "@/lib/story-share-card-image";
import { resolveStoryBySlugDirect } from "@/lib/stories";

export const runtime = "nodejs";

export const alt = "khatinews.com story card";
export const size = { width: 1080, height: 1080 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

/** Public preview. Always the free card: the count, or the khatinews mark. */
export default async function Image({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveStoryBySlugDirect(slug);
  const card = resolved ? buildStoryShareCard(resolved.story, false) : storyShareMarkCard();
  return renderStoryShareCard(card);
}
