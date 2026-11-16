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
  /** Shown in the /pro info-icon tooltip. */
  tooltip?: string;
  tooltipBn?: string;
};

export const FREE_TIER_TAGLINE =
  "Full news coverage and trust tools for everyone." as const;

export const PRO_TIER_TAGLINE =
  "Follow the stories you care about and catch when coverage shifts." as const;

/** Home feed cluster count (curated slice; full archive on /browse for all users). */
export const HOME_TOP_STORIES_LIMIT = 24;

/** Features that require an active Pro subscription (checkout not wired yet). */
export const PRO_ONLY_FEATURE_IDS = [
  "follow_story",
  "track_article_clicks",
  "story_shared_ownership_alerts",
  "story_unnamed_source",
  "story_taken_down_vault",
  "first_headline",
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
    tooltip:
      "Headline clusters on home (24 stories) and the full archive on Browse for every reader.",
    tooltipBn: "হোমে শীর্ষ ক্লাস্টার; সবাই /browse-এ পুরো আর্কাইভ পায়।",
  },
  {
    id: "headline_clash",
    category: "AI Insights",
    categoryBn: "AI অন্তর্দৃষ্টি",
    name: "Headline Clash (Side-by-Side)",
    nameBn: "শিরোনাম clash (পাশাপাশি)",
    free: "yes",
    pro: "yes",
    tooltip:
      "On a story page, see each outlet's headline next to the others — same event, different framing.",
    tooltipBn: "গল্পের পাতায় একই ঘটনার বিভিন্ন শিরোনাম পাশাপাশি।",
  },
  {
    id: "anti_clickbait_summary",
    category: "AI Insights",
    categoryBn: "AI অন্তর্দৃষ্টি",
    name: "Quick summary from different sources",
    nameBn: "বিভিন্ন উৎস থেকে দ্রুত সারসংক্ষেপ",
    free: "yes",
    pro: "yes",
    tooltip:
      "Up to three neutral bullets from RSS excerpts and headlines — rules only, no AI rewrite.",
    tooltipBn: "RSS থেকে দ্রুত সারসংক্ষেপ; AI দিয়ে পুনর্লিখন নয়।",
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
    tooltip:
      "Profile shows left/center/right-style reading mix from stories you open on this device.",
    tooltipBn: "প্রোফাইলে এই ডিভাইসে যে খবর খুলেছেন তার ভিত্তিতে পড়ার ঝোঁক।",
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
    tooltip: "Periodic digest of how outlets framed the week's big stories.",
    tooltipBn: "সপ্তাহের বড় খবরে মিডিয়ার ফ্রেমিং সংক্ষেপ।",
  },
  {
    id: "source_ownership_labels",
    category: "Trust & Bias",
    categoryBn: "বিশ্বাস ও ঝুঁক",
    name: "Publisher ownership (per source)",
    nameBn: "প্রকাশকের মালিকানা (উৎস অনুযায়ী)",
    free: "yes",
    pro: "yes",
    freeNote: "On story detail source lists",
    proNote: "On story detail source lists",
    tooltip: "Who owns or controls each paper on the story's source list.",
    tooltipBn: "গল্পের উৎস তালিকায় প্রকাশকের মালিকানা লেবেল।",
  },
  {
    id: "story_shared_ownership_alerts",
    category: "Trust & Bias",
    categoryBn: "বিশ্বাস ও ঝুঁক",
    name: "Shared ownership alerts on a story",
    nameBn: "একই মালিকানায় একাধিক উৎস — সতর্কতা",
    free: "locked",
    pro: "yes",
    freeNote: "Outlet and owner count on the story page",
    proNote:
      "Names the shared owner or parent when coverage looks multi-source but outlets belong to the same group",
    tooltip:
      "When two or more outlets in one cluster share an owner, we flag it on the story page.",
    tooltipBn:
      "এক ক্লাস্টারে এক মালিকের একাধিক গণমাধ্যম থাকলে সতর্কতা দেখায়।",
  },
  {
    id: "story_unnamed_source",
    category: "Trust & Bias",
    categoryBn: "বিশ্বাস ও ঝুঁক",
    name: "The unnamed source",
    nameBn: "নামহীন সূত্র",
    free: "locked",
    pro: "yes",
    freeNote: "How many outlets attribute the story to someone they don't name",
    proNote: "Which papers hid the name, and which outlet printed one",
    tooltip:
      "Detects anonymous sourcing (সূত্র, sources say, etc.) and shows who hid names vs who printed one.",
    tooltipBn:
      "নামহীন সূত্র চিহ্নিত করে — কে নাম গোপন করেছে, কে নাম দিয়েছে।",
  },
  {
    id: "story_taken_down_vault",
    category: "Trust & Bias",
    categoryBn: "বিশ্বাস ও ঝুঁক",
    name: "The taken-down vault",
    nameBn: "সরিয়ে নেওয়া খবরের ভল্ট",
    free: "locked",
    pro: "yes",
    freeNote: "Removed from their site at 6:40pm. The card stays up",
    proNote: "Original headline and text: this is what it said at 1:12pm",
    tooltip:
      "If an outlet removes a page, the card stays with removal time; Pro can see what we captured from RSS.",
    tooltipBn:
      "আউটলেট পাতা সরালে কার্ড থাকে; Pro-তে RSS থেকে সংরক্ষিত মূল লেখা।",
  },
  {
    id: "story_walkback_line",
    category: "Trust & Bias",
    categoryBn: "বিশ্বাস ও ঝুঁক",
    name: "The line under the headline",
    nameBn: "শিরোনামের নিচের বাক্য",
    free: "yes",
    pro: "yes",
    freeNote: "The buried sentence, above the headline",
    proNote: "That sentence is the line on the share card",
    tooltip:
      "Finds a buried তবে / অন্যদিকে-style line after a sensational headline and pins it above the title.",
    tooltipBn:
      "উত্তেজনাপূর্ণ শিরোনামের পর দাব মৃদু করার বাক্য শিরোনামের উপরে দেখায়।",
  },
  {
    id: "first_headline",
    category: "Trust & Bias",
    categoryBn: "বিশ্বাস ও ঝুঁক",
    name: "First headline",
    nameBn: "প্রথম শিরোনাম",
    free: "yes",
    pro: "yes",
    freeNote: "Both lines and the clock when a desk edits and adds no correction",
    proNote: "The social preview frozen the moment the story appeared",
    tooltip:
      "When a desk edits a headline without a correction, see the first wording, today's line, and the clock.",
    tooltipBn:
      "শিরোনাম বদলালে প্রথম ও বর্তমান লাইন ও সময় — সংশোধনী ছাড়া এডিটেও।",
  },
  {
    id: "follow_story",
    category: "Core Feed",
    categoryBn: "মূল ফিড",
    name: "Follow a Story",
    nameBn: "খবর ফলো করুন",
    free: "locked",
    pro: "yes",
    proNote: "We’ll notify you when new outlets pick up the story or the framing changes.",
    tooltip: "Save a story on home or detail; get alerts when coverage or framing shifts (Pro).",
    tooltipBn: "খবর ফলো করুন; কভারেজ বা ফ্রেম বদলালে অ্যালার্ট (Pro)।",
  },
  {
    id: "track_article_clicks",
    category: "Trust & Bias",
    categoryBn: "বিশ্বাস ও ঝুঁক",
    name: "Article click tracking (My News Bias)",
    nameBn: "আউটলেট লিংক ট্র্যাকিং (আমার নিউজ bias)",
    free: "locked",
    pro: "yes",
    proNote: "Counts which outlet links you open for your personal bias dashboard.",
    tooltip:
      "Optional: count outbound article clicks on this device to refine My News Bias (Pro, opt-in).",
    tooltipBn:
      "আউটলেট লিংক ক্লিক গোনা — My News Bias-এর জন্য (Pro, ইচ্ছামতো)।",
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
    tooltip: "Follow topics and public figures on Profile for custom radar alerts (Pro).",
    tooltipBn: "প্রোফাইলে টপিক ও ব্যক্তি ফলো — কাস্টম রাডার (Pro)।",
  },
];

export function featureRequiresPro(id: ProOnlyFeatureId): boolean {
  return PRO_ONLY_FEATURE_IDS.includes(id);
}

export function getFeatureRow(id: string): SubscriptionFeatureRow | undefined {
  return SUBSCRIPTION_FEATURE_MATRIX.find((row) => row.id === id);
}
