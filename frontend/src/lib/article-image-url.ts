/** Static fallback when RSS / cluster payloads omit `image_url`. */
export const STORY_IMAGE_PLACEHOLDER = "/story-placeholder.svg";

export function resolveArticleImageUrl(imageUrl?: string | null): string {
  const trimmed = imageUrl?.trim();
  return trimmed ? trimmed : STORY_IMAGE_PLACEHOLDER;
}

export function resolveStoryLeadImageUrl(story: {
  slug: string;
  articles: { imageUrl?: string }[];
}): string {
  for (const article of story.articles) {
    const trimmed = article.imageUrl?.trim();
    if (trimmed && trimmed !== STORY_IMAGE_PLACEHOLDER) {
      return trimmed;
    }
  }
  return STORY_IMAGE_PLACEHOLDER;
}
