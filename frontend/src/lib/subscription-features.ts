/** Free vs Pro feature matrix — product source of truth until Supabase entitlements ship. */

export type TierAvailability = "yes" | "locked" | "pro_only";

export type SubscriptionFeatureRow = {
  id: string;
  category: string;
  categoryBn: string;
  name: string;
  nameBn: string;
  free: TierAvailability;
  pro: TierAvailability;
  freeNote?: string;
  proNote?: string;
};

export const FREE_TIER_TAGLINE =
  "Full news coverage and trust tools for everyone." as const;

export const PRO_TIER_TAGLINE = "Insiders & analysts — pro analytics." as const;

/** Home feed cluster count (curated slice; full archive on /browse for all users). */
export const HOME_TOP_STORIES_LIMIT = 24;

/** Features that require an active Pro subscription (checkout not wired yet). */
export const PRO_ONLY_FEATURE_IDS = [
  "follow_story",
  "narrative_evolution_timeline",
  "custom_topic_radar_alerts",
] as const;

export type ProOnlyFeatureId = (typeof PRO_ONLY_FEATURE_IDS)[number];

export const SUBSCRIPTION_FEATURE_MATRIX: SubscriptionFeatureRow[] = [
  {
    id: "daily_top_10",
    category: "Core Feed",
    categoryBn: "মূল ফিড",
    name: "Top News Major Stories",
    nameBn: "শীর্ষ খবর — বড় ঘটনা",
    free: "yes",
    pro: "yes",
    freeNote: "Home highlights + full browse archive",
    proNote: "Priority loading on home",
  },
  {
    id: "headline_clash",
    category: "AI Insights",
    categoryBn: "AI অন্তর্দৃষ্টি",
    name: "Headline Clash (Side-by-Side)",
    nameBn: "শিরোনাম clash (পাশাপাশি)",
    free: "yes",
    pro: "yes",
  },
  {
    id: "anti_clickbait_summary",
    category: "AI Insights",
    categoryBn: "AI অন্তর্দৃষ্টি",
    name: "Quick summary from different sources",
    nameBn: "বিভিন্ন উৎস থেকে দ্রুত সারাংশ",
    free: "yes",
    pro: "yes",
  },
  {
    id: "tone_depth_badges",
    category: "AI Insights",
    categoryBn: "AI অন্তর্দৃষ্টি",
    name: "Tone & Depth Score Badges",
    nameBn: "টোন ও গভীরতা স্কোর ব্যাজ",
    free: "yes",
    pro: "yes",
  },
  {
    id: "my_news_bias_dashboard",
    category: "Trust & Bias",
    categoryBn: "বিশ্বাস ও ঝুঁক",
    name: '"My News Bias" Dashboard',
    nameBn: '"আমার নিউজ bias" ড্যাশবোর্ড',
    free: "yes",
    pro: "yes",
    freeNote: "Personal weekly reading habit tracker",
    proNote: "Personal weekly reading habit tracker",
  },
  {
    id: "media_spin_digest",
    category: "Trust & Bias",
    categoryBn: "বিশ্বাস ও ঝুঁক",
    name: 'Weekly "Media Spin" Digest',
    nameBn: 'সাপ্তাহিক "মিডিয়া spin" ডাইজেস্ট',
    free: "yes",
    pro: "yes",
    freeNote: "Automated summary briefing",
    proNote: "Automated summary briefing",
  },
  {
    id: "follow_story",
    category: "Core Feed",
    categoryBn: "মূল ফিড",
    name: "Follow a Story",
    nameBn: "খবর ফলো করুন",
    free: "locked",
    pro: "yes",
    proNote: "Get updates when coverage shifts on stories you track",
  },
  {
    id: "narrative_evolution_timeline",
    category: "Pro Analytics",
    categoryBn: "Pro বিশ্লেষণ",
    name: "Narrative Evolution Timeline",
    nameBn: "আখ্যান বিবর্তন টাইমলাইন",
    free: "locked",
    pro: "yes",
    proNote: "30-day graphs tracking media bias shifts",
  },
  {
    id: "custom_topic_radar_alerts",
    category: "Pro Analytics",
    categoryBn: "Pro বিশ্লেষণ",
    name: "Custom Topic Radar & Alerts",
    nameBn: "কাস্টম টপিক রাডার ও অ্যালার্ট",
    free: "locked",
    pro: "yes",
    proNote: "Keyword tracking & webhooks",
  },
];

export function featureRequiresPro(id: ProOnlyFeatureId): boolean {
  return PRO_ONLY_FEATURE_IDS.includes(id);
}

export function getFeatureRow(id: string): SubscriptionFeatureRow | undefined {
  return SUBSCRIPTION_FEATURE_MATRIX.find((row) => row.id === id);
}
