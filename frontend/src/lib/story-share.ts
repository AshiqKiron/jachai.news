import type { Story } from "@/lib/demo-data";
import { STORY_IMAGE_PLACEHOLDER } from "@/lib/article-image-url";

const DEFAULT_GITHUB_ISSUES_NEW =
  "https://github.com/AshiqKiron/jachai.news/issues/new";

const DEFAULT_SHARE_DESCRIPTION =
  "Compare Bangladeshi headlines across outlets. Bias signals, blindspots, and rumor flags — Shorup News.";

/** Branded static fallback when a story has no RSS lead image (also used in dynamic OG art). */
export const OG_SHARE_DEFAULT_PATH = "/og-share-default.svg";

export function storyPath(slug: string): string {
  return `/story/${encodeURIComponent(slug)}`;
}

export function resolvePublicSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function buildStoryShareUrl(slug: string, origin?: string): string {
  const base = (origin ?? resolvePublicSiteOrigin()).replace(/\/$/, "");
  const path = storyPath(slug);
  return base ? `${base}${path}` : path;
}

export function resolveMetadataBaseOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export function toAbsoluteShareUrl(pathOrUrl: string, origin?: string): string {
  const trimmed = pathOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const base = (origin ?? resolveMetadataBaseOrigin()).replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

/** First HTTPS lead image from cluster articles, if any. */
export function pickStoryShareLeadImage(story: Story): string | null {
  for (const article of story.articles) {
    const trimmed = article.imageUrl?.trim();
    if (!trimmed || trimmed === STORY_IMAGE_PLACEHOLDER) continue;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
  }
  return null;
}

export function buildStoryShareTitle(story: Story): string {
  const bn = story.titleBn?.trim();
  const en = story.title?.trim();
  if (bn && en && bn !== en) return `${bn} | ${en}`;
  return bn || en || "Shorup News story";
}

export function buildStoryShareDescription(story: Story): string {
  const bullets = story.summaryBullets?.map((b) => b.trim()).filter(Boolean);
  if (bullets && bullets.length > 0) {
    return bullets.slice(0, 2).join(" · ").slice(0, 280);
  }

  const summary = story.summary?.trim() || story.summaryBn?.trim();
  if (summary) return summary.slice(0, 280);

  for (const article of story.articles) {
    const excerpt = article.excerpt?.trim();
    if (excerpt) return excerpt.slice(0, 280);
  }

  return DEFAULT_SHARE_DESCRIPTION;
}

export type StoryShareOpenGraph = {
  title: string;
  description: string;
  pageUrl: string;
  /** Absolute HTTPS image for crawlers, or null → use route `opengraph-image`. */
  imageUrl: string | null;
};

export function buildStoryShareOpenGraph(story: Story, slug: string): StoryShareOpenGraph {
  const origin = resolveMetadataBaseOrigin();
  const lead = pickStoryShareLeadImage(story);
  return {
    title: buildStoryShareTitle(story),
    description: buildStoryShareDescription(story),
    pageUrl: buildStoryShareUrl(slug, origin),
    imageUrl: lead ? toAbsoluteShareUrl(lead, origin) : null,
  };
}

export type SocialShareNetwork =
  | "facebook"
  | "x"
  | "whatsapp"
  | "linkedin"
  | "telegram"
  | "reddit"
  | "email";

export function buildSocialShareUrl(
  network: SocialShareNetwork,
  pageUrl: string,
  text: string,
): string {
  const u = encodeURIComponent(pageUrl);
  const t = encodeURIComponent(text);

  switch (network) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "x":
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`${text} ${pageUrl}`)}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
    case "reddit":
      return `https://www.reddit.com/submit?url=${u}&title=${t}`;
    case "email":
      return `mailto:?subject=${t}&body=${encodeURIComponent(`${text}\n\n${pageUrl}`)}`;
  }
}

export function buildStoryEmbedSnippet(pageUrl: string): string {
  return `<iframe src="${pageUrl}" width="600" height="400" style="border:0;" loading="lazy" title="Shorup News story"></iframe>`;
}

export function buildStoryReportIssueHref(slug: string, title: string, pageUrl: string): string {
  const override = process.env.NEXT_PUBLIC_REPORT_ISSUES_URL?.trim();
  if (override) {
    const sep = override.includes("?") ? "&" : "?";
    return `${override}${sep}story=${encodeURIComponent(slug)}`;
  }

  const email = process.env.NEXT_PUBLIC_REPORT_ISSUES_EMAIL?.trim();
  const subject = encodeURIComponent(`Shorup story report: ${title}`);
  const body = encodeURIComponent(
    `Please describe the issue (wrong cluster, broken link, offensive content, etc.):\n\nStory: ${title}\nURL: ${pageUrl}\n`,
  );

  if (email) {
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  const issueTitle = encodeURIComponent(`Story: ${title}`);
  const issueBody = encodeURIComponent(
    `**Story URL:** ${pageUrl}\n\n**What is wrong?**\n\n`,
  );
  return `${DEFAULT_GITHUB_ISSUES_NEW}?title=${issueTitle}&body=${issueBody}`;
}

export const SOCIAL_SHARE_NETWORKS: {
  id: SocialShareNetwork;
  labelEn: string;
  labelBn: string;
}[] = [
  { id: "facebook", labelEn: "Share on Facebook", labelBn: "ফেসবুকে শেয়ার" },
  { id: "x", labelEn: "Share on X", labelBn: "X-এ শেয়ার" },
  { id: "whatsapp", labelEn: "Share on WhatsApp", labelBn: "হোয়াটসঅ্যাপে শেয়ার" },
  { id: "linkedin", labelEn: "Share on LinkedIn", labelBn: "লিংকডইনে শেয়ার" },
  { id: "telegram", labelEn: "Share on Telegram", labelBn: "টেলিগ্রামে শেয়ার" },
];

/** Story detail toolbar (Ground News–style primary share row). */
export const STORY_DETAIL_SHARE_NETWORKS: {
  id: SocialShareNetwork;
  labelEn: string;
  labelBn: string;
}[] = [
  { id: "facebook", labelEn: "Share on Facebook", labelBn: "ফেসবুকে শেয়ার" },
  { id: "x", labelEn: "Share on X", labelBn: "X-এ শেয়ার" },
  { id: "linkedin", labelEn: "Share on LinkedIn", labelBn: "লিংকডইনে শেয়ার" },
  { id: "reddit", labelEn: "Share on Reddit", labelBn: "রেডডিটে শেয়ার" },
  { id: "email", labelEn: "Share by email", labelBn: "ইমেইলে শেয়ার" },
];
