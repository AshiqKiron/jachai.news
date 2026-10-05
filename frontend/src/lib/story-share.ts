const DEFAULT_GITHUB_ISSUES_NEW =
  "https://github.com/AshiqKiron/jachai.news/issues/new";

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

export type SocialShareNetwork = "facebook" | "x" | "whatsapp" | "linkedin" | "telegram";

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
  }
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
