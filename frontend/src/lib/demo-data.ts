import { resolveArticleImageUrl } from "@/lib/article-image-url";
import type { Article } from "@/lib/api";
import type { Factuality, Perspective } from "@/lib/perspectives";

export type NewsSource = {
  id: string;
  name: string;
  nameBn: string;
  perspective: Perspective;
  factuality: Factuality;
  language: "bn" | "en";
  biasScore: number;
};

export type StoryArticle = {
  sourceId: string;
  headline: string;
  url: string;
  excerpt: string;
  publishedAt: string;
  framingNote?: string;
  /** Overrides source default when a story needs a finer perspective label. */
  perspective?: Perspective;
  /** Populated from API cluster payloads for perspective / blindspot signals. */
  sourceName?: string;
  biasScore?: number | null;
  /** Publisher from the sources table when the cluster payload includes it. */
  ownerName?: string | null;
  ownerUrl?: string | null;
  parentName?: string | null;
  parentUrl?: string | null;
  imageUrl?: string;
  /** API rumor flag. Non-political coverage puts these in the rumor bucket. */
  isRumor?: boolean;
};

function withDemoArticleImages(stories: Story[]): Story[] {
  return stories.map((story) => ({
    ...story,
    articles: story.articles.map((article) => ({
      ...article,
      imageUrl: resolveArticleImageUrl(article.imageUrl),
    })),
  }));
}

export type Story = {
  slug: string;
  title: string;
  titleBn: string;
  summary: string;
  summaryBn: string;
  /** Rule-based neutral bullets (from RSS excerpts/headlines). */
  summaryBullets?: string[];
  category: string;
  categoryBn: string;
  isBlindspot: boolean;
  blindspotPerspective?: Perspective;
  perspectiveSummaries: Partial<Record<Perspective, string>>;
  articles: StoryArticle[];
  updatedAt: string;
};

export const BD_SOURCES: NewsSource[] = [
  {
    id: "prothom-alo",
    name: "Prothom Alo",
    nameBn: "প্রথম আলো",
    perspective: "neutral",
    factuality: "high",
    language: "bn",
    biasScore: -0.08,
  },
  {
    id: "daily-star",
    name: "The Daily Star",
    nameBn: "দ্য ডেইলি স্টার",
    perspective: "neutral",
    factuality: "high",
    language: "en",
    biasScore: -0.12,
  },
  {
    id: "bdnews24",
    name: "bdnews24.com",
    nameBn: "বিডিনিউজ২৪",
    perspective: "neutral",
    factuality: "high",
    language: "bn",
    biasScore: 0.02,
  },
  {
    id: "jugantor",
    name: "Jugantor",
    nameBn: "যুগান্তর",
    perspective: "establishment",
    factuality: "mixed",
    language: "bn",
    biasScore: 0.42,
  },
  {
    id: "samakal",
    name: "Samakal",
    nameBn: "সমকাল",
    perspective: "opposition",
    factuality: "mixed",
    language: "bn",
    biasScore: -0.38,
  },
  {
    id: "new-age",
    name: "New Age",
    nameBn: "নিউ এইজ",
    perspective: "opposition",
    factuality: "high",
    language: "en",
    biasScore: -0.45,
  },
  {
    id: "bbc-bangla",
    name: "BBC Bangla",
    nameBn: "বিবিসি বাংলা",
    perspective: "international",
    factuality: "high",
    language: "bn",
    biasScore: 0,
  },
  {
    id: "dw-bangla",
    name: "DW Bangla",
    nameBn: "ডিডব্লিউ বাংলা",
    perspective: "international",
    factuality: "high",
    language: "bn",
    biasScore: 0.05,
  },
  {
    id: "manab-zamin",
    name: "Manab Zamin",
    nameBn: "মানবজমিন",
    perspective: "neutral",
    factuality: "mixed",
    language: "bn",
    biasScore: 0.15,
  },
  {
    id: "financial-express",
    name: "The Financial Express",
    nameBn: "ফাইন্যান্সিয়াল এক্সপ্রেস",
    perspective: "establishment",
    factuality: "high",
    language: "en",
    biasScore: 0.28,
  },
];

const DEMO_STORIES_BASE: Story[] = [
  {
    slug: "dhaka-derby-abahani-win",
    title: "Abahani take the Dhaka derby by a single goal",
    titleBn: "এক গোলে ঢাকা ডার্বি জিতল আবাহনী",
    summary:
      "The score is the same across desks. One headline sells the noise, one sticks to the match, and one repeats a claim the clubs have not confirmed.",
    summaryBn:
      "স্কোর সবাই একই দিচ্ছে। এক শিরোনাম শোরগোল বিকোয়, একটা ম্যাচের হিসাব রাখে, একটা দাবি ক্লাব এখনো মানেনি।",
    category: "Sports",
    categoryBn: "খেলা",
    isBlindspot: false,
    updatedAt: "2026-11-11T21:10:00Z",
    perspectiveSummaries: {},
    articles: [
      {
        sourceId: "manab-zamin",
        headline: "চাঞ্চল্যকর! ডার্বিতে আবাহনীর জয় নিয়ে মাঠ উত্তাল",
        url: "https://mzamin.com/sports/dhaka-derby",
        excerpt: "শেষ বাঁশির পর গ্যালারি ফেটে পড়ে। গোলের মিনিট এই খবরে নেই।",
        publishedAt: "2026-11-11T20:40:00Z",
      },
      {
        sourceId: "samakal",
        headline: "আবাহনী–মোহামেডানের ডার্বিতে জয় আবাহনীর",
        url: "https://samakal.com/sports/dhaka-derby",
        excerpt: "দ্বিতীয়ার্ধের একমাত্র গোলে ম্যাচ শেষ। লাল কার্ড হয়নি।",
        publishedAt: "2026-11-11T20:20:00Z",
      },
      {
        sourceId: "daily-star",
        headline: "Abahani take the Dhaka derby by a single goal",
        url: "https://www.thedailystar.net/sports/dhaka-derby",
        excerpt: "The winner came in the 71st minute. Possession finished nearly level.",
        publishedAt: "2026-11-11T20:05:00Z",
      },
      {
        sourceId: "jugantor",
        headline: "ডার্বির রেফারিকে বদলানো হবে— এ দাবি এখনো ক্লাব মানেনি",
        url: "https://www.jugantor.com/sports/dhaka-derby",
        excerpt: "পোস্টে বলা হয়েছে পরের ম্যাচে রেফারি বদলাবে। দুই ক্লাবই এখনো নীরব।",
        publishedAt: "2026-11-11T19:40:00Z",
        isRumor: true,
      },
    ],
  },
  {
    slug: "women-asia-cup-final",
    title: "Bangladesh women reach the Asia Cup final",
    titleBn: "এশিয়া কাপের ফাইনালে বাংলাদেশ নারী দল",
    summary:
      "Desks agree Bangladesh are in the final. Coverage runs from a match report to a lineup claim that selectors have not confirmed.",
    summaryBn:
      "ফাইনালে ওঠার খবর মিলছে। একটা ম্যাচ রিপোর্ট, একটা একাদশের দাবি যা নির্বাচকরা এখনো বলেননি।",
    category: "Sports",
    categoryBn: "খেলা",
    isBlindspot: false,
    updatedAt: "2026-11-11T16:30:00Z",
    perspectiveSummaries: {},
    articles: [
      {
        sourceId: "manab-zamin",
        headline: "হতবাক! বাংলাদেশ নারী দল এশিয়া কাপের ফাইনালে",
        url: "https://mzamin.com/sports/women-asia-cup-final",
        excerpt: "জয়ের পর ড্রেসিংরুমের ছবি ছড়িয়ে পড়েছে। স্কোরকার্ড পরে।",
        publishedAt: "2026-11-11T16:05:00Z",
      },
      {
        sourceId: "jugantor",
        headline: "নারী এশিয়া কাপে ফাইনালে বাংলাদেশ",
        url: "https://www.jugantor.com/sports/women-asia-cup-final",
        excerpt: "সেমিফাইনালে চার উইকেটের জয়। ফাইনাল শনিবার।",
        publishedAt: "2026-11-11T15:40:00Z",
      },
      {
        sourceId: "prothom-alo",
        headline: "বাংলাদেশ নারী দল এশিয়া কাপের ফাইনালে",
        url: "https://www.prothomalo.com/sports/women-asia-cup-final",
        excerpt: "সেমিফাইনালে ৪ উইকেটে জয়। প্রতিপক্ষ ও ভেন্যু বোর্ড জানিয়েছে।",
        publishedAt: "2026-11-11T15:20:00Z",
      },
      {
        sourceId: "new-age",
        headline: "Unverified posts say a Bangladesh batter will miss the final",
        url: "https://www.newagebd.net/sports/women-asia-cup-final",
        excerpt: "Selectors have not confirmed any absence. The final date is already set.",
        publishedAt: "2026-11-11T15:00:00Z",
        isRumor: true,
      },
    ],
  },
  {
    slug: "buriganga-plastic-cleanup",
    title: "Crews lift a week of plastic from the Buriganga",
    titleBn: "এক সপ্তাহে বুড়িগঙ্গা থেকে তোলা হলো প্লাস্টিক",
    summary:
      "The tonnage is published. One desk leads with the picture, one with the count, and one repeats a shutdown claim the city has not made.",
    summaryBn:
      "ওজনের হিসাব বেরিয়েছে। এক ডেস্ক ছবি আগে রাখে, একটা সংখ্যা, একটা বন্ধের দাবি যা সিটি কর্পোরেশন বলেনি।",
    category: "Environment",
    categoryBn: "পরিবেশ",
    isBlindspot: false,
    updatedAt: "2026-11-11T14:00:00Z",
    perspectiveSummaries: {},
    articles: [
      {
        sourceId: "manab-zamin",
        headline: "অবিশ্বাস্য! বুড়িগঙ্গায় প্লাস্টিকের স্তর দেখে শহর থমকে",
        url: "https://mzamin.com/environment/buriganga-plastic",
        excerpt: "নৌকা থেকে তোলা বর্জ্যের ছবি ভাইরাল। টনের হিসাব এই খবরে নেই।",
        publishedAt: "2026-11-11T13:30:00Z",
      },
      {
        sourceId: "samakal",
        headline: "বুড়িগঙ্গায় প্লাস্টিক সরাতে নৌকা ছাড়া হয়েছে",
        url: "https://samakal.com/environment/buriganga-plastic",
        excerpt: "সদরঘাট থেকে শ্যামবাজার পর্যন্ত সাত দিন ধরে তোলা চলছে।",
        publishedAt: "2026-11-11T13:05:00Z",
      },
      {
        sourceId: "bdnews24",
        headline: "বুড়িগঙ্গায় এক সপ্তাহে তোলা প্লাস্টিকের হিসাব প্রকাশ",
        url: "https://bdnews24.com/environment/buriganga-plastic",
        excerpt: "সিটি কর্পোরেশন বলছে, সাত দিনে প্রায় ১৮ টন প্লাস্টিক তোলা হয়েছে।",
        publishedAt: "2026-11-11T12:40:00Z",
      },
      {
        sourceId: "daily-star",
        headline: "Unconfirmed posts say the Buriganga cleanup will stop next week",
        url: "https://www.thedailystar.net/environment/buriganga-plastic",
        excerpt: "The city has not announced a stop. The published figure covers seven days.",
        publishedAt: "2026-11-11T12:10:00Z",
        isRumor: true,
      },
    ],
  },
  {
    slug: "saint-martins-coral-survey",
    title: "Saint Martin's survey finds a small rise in coral cover",
    titleBn: "সেন্ট মার্টিনের জরিপে প্রবালের আচ্ছাদন সামান্য বেড়েছে",
    summary:
      "The survey number is shared. Desks differ on whether to lead with the postcard or the method, and one repeats a resort claim that is still unconfirmed.",
    summaryBn:
      "জরিপের সংখ্যা মিলছে। কেউ ছবি আগে রাখে, কেউ পদ্ধতি। একটা রিসোর্টের দাবি এখনো নিশ্চিত নয়।",
    category: "Environment",
    categoryBn: "পরিবেশ",
    isBlindspot: false,
    updatedAt: "2026-11-11T11:20:00Z",
    perspectiveSummaries: {},
    articles: [
      {
        sourceId: "manab-zamin",
        headline: "চমকপ্রদ! সেন্ট মার্টিনের প্রবাল আবার রঙ ফেরাচ্ছে",
        url: "https://mzamin.com/environment/saint-martins-coral",
        excerpt: "পানির নিচের ছবি ছড়িয়ে পড়েছে। জরিপের শতাংশ এই খবরে নেই।",
        publishedAt: "2026-11-11T10:50:00Z",
      },
      {
        sourceId: "jugantor",
        headline: "সেন্ট মার্টিনে প্রবাল দেখতে পর্যটক সীমিত রাখার কথা",
        url: "https://www.jugantor.com/environment/saint-martins-coral",
        excerpt: "স্থানীয়রা বলছেন, ভিড় কমলে প্রবালের ওপর চাপ কমে।",
        publishedAt: "2026-11-11T10:20:00Z",
      },
      {
        sourceId: "prothom-alo",
        headline: "সেন্ট মার্টিনে প্রবালের আচ্ছাদন সামান্য বেড়েছে",
        url: "https://www.prothomalo.com/environment/saint-martins-coral",
        excerpt: "নতুন জরিপে আগের বছরের চেয়ে আচ্ছাদন প্রায় দুই শতাংশ বেশি।",
        publishedAt: "2026-11-11T09:55:00Z",
      },
      {
        sourceId: "bbc-bangla",
        headline: "Unverified claim says a new resort will be built on the reef edge",
        url: "https://www.bbc.com/bengali/saint-martins-coral",
        excerpt: "No permit notice matches the claim. The survey only reports coral cover.",
        publishedAt: "2026-11-11T09:20:00Z",
        isRumor: true,
      },
    ],
  },
  {
    slug: "saff-championship-late-winner",
    title: "Bangladesh opens the SAFF Championship with a late winner",
    titleBn: "দেরিতে গোল করে সাফ চ্যাম্পিয়নশিপ শুরু বাংলাদেশের",
    summary:
      "Desks agree on the scoreline. They split on whether the winner shows a settled side or a team that left the result too late.",
    summaryBn:
      "স্কোর নিয়ে সবাই একমত। জয়টা দলের স্থিরতা, নাকি দেরিতে হওয়া একটা গোল— সেই বিভাজনই খবরের মূল।",
    category: "Sports",
    categoryBn: "খেলা",
    isBlindspot: false,
    updatedAt: "2026-11-11T18:40:00Z",
    perspectiveSummaries: {
      opposition:
        "Questions the coach for leaving the result to the last ten minutes and the league's thin squad depth.",
      neutral:
        "Match report: the goal, the chances, and what the group table says after matchday one.",
      establishment:
        "Frames the win as proof the federation's camp and selection calls are paying off.",
      international:
        "Sets the result next to other SAFF openers, without domestic football politics.",
    },
    articles: [
      {
        sourceId: "manab-zamin",
        headline: "চাঞ্চল্যকর! সাফে বাংলাদেশের জয় নিয়ে যা কেউ ভাবেনি",
        url: "https://mzamin.com/sports/saff-championship-opener",
        excerpt: "শেষ মিনিটের গোলের পর মাঠের বাইরে উচ্ছ্বাস। ম্যাচের পূর্ণ হিসাব পরে।",
        publishedAt: "2026-11-11T18:10:00Z",
      },
      {
        sourceId: "samakal",
        headline: "শেষ দশ মিনিটের জয়— কোচের পরিকল্পনা নিয়ে প্রশ্ন",
        url: "https://samakal.com/sports/saff-championship-opener",
        excerpt: "ম্যাচজয়ী গোল এলেও মধ্যমাঠে নিয়ন্ত্রণ ছিল দুর্বল, বলছেন সাবেক ফুটবলাররা।",
        publishedAt: "2026-11-11T17:55:00Z",
      },
      {
        sourceId: "daily-star",
        headline: "Late strike sends Bangladesh top of the SAFF group",
        url: "https://www.thedailystar.net/sports/saff-championship-opener",
        excerpt: "The winner came in the 84th minute. The group table now has Bangladesh on three points.",
        publishedAt: "2026-11-11T17:40:00Z",
      },
      {
        sourceId: "jugantor",
        headline: "গুজব: সাফের জয় নিয়ে দলের ভিতরে অসন্তোষ",
        url: "https://www.jugantor.com/sports/saff-championship-opener",
        excerpt: "ড্রেসিংরুমের কথা যাচাই হয়নি। ফেডারেশন এখনো কিছু জানায়নি।",
        publishedAt: "2026-11-11T17:20:00Z",
        isRumor: true,
      },
    ],
  },
  {
    slug: "sundarbans-tiger-survey",
    title: "Latest Sundarbans survey counts more tigers than the last census",
    titleBn: "সর্বশেষ জরিপে সুন্দরবনে বাঘের সংখ্যা আগের চেয়ে বেশি",
    summary:
      "Outlets share the new count. They differ on whether it is a conservation gain or a count that still hides habitat loss.",
    summaryBn:
      "নতুন সংখ্যা সবাই ছাপছে। এটা সংরক্ষণের সাফল্য, নাকি আবাস সংকটকে ঢেকে রাখা একটা হিসাব— সেখানেই ভাগ।",
    category: "Environment",
    categoryBn: "পরিবেশ",
    isBlindspot: false,
    updatedAt: "2026-11-11T12:15:00Z",
    perspectiveSummaries: {
      opposition:
        "Treats the higher count as incomplete while salinity and prey loss keep shrinking usable forest.",
      neutral:
        "Reports the survey method, the new figure, and how it compares with the previous census.",
      establishment:
        "Credits forest patrols and the breeding programme for the rise.",
      international:
        "Compares the Bangladesh count with the Indian Sundarbans survey, without local blame.",
    },
    articles: [
      {
        sourceId: "manab-zamin",
        headline: "অবিশ্বাস্য! সুন্দরবনে বাঘ বেড়েছে— জঙ্গল নাকি ফিরে এল",
        url: "https://mzamin.com/environment/sundarbans-tiger-survey",
        excerpt: "নতুন সংখ্যা প্রকাশের পর সামাজিক মাধ্যমে উচ্ছ্বাস। জরিপের পদ্ধতি এই খবরে নেই।",
        publishedAt: "2026-11-11T11:40:00Z",
      },
      {
        sourceId: "jugantor",
        headline: "টহল ও প্রজনন কর্মসূচিতে সুন্দরবনের বাঘ বাড়ল",
        url: "https://www.jugantor.com/environment/sundarbans-tiger-survey",
        excerpt: "বন বিভাগের হিসাবে নিয়মিত টহল ও আবাস রক্ষায় এই বৃদ্ধি এসেছে।",
        publishedAt: "2026-11-11T11:05:00Z",
      },
      {
        sourceId: "prothom-alo",
        headline: "সুন্দরবনে বাঘ বেড়েছে— জরিপ কীভাবে হলো",
        url: "https://www.prothomalo.com/environment/sundarbans-tiger-survey",
        excerpt: "ক্যামেরা ট্র্যাপ ও পায়ের ছাপ মিলিয়ে নতুন হিসাব আগের শুমারির চেয়ে বেশি।",
        publishedAt: "2026-11-11T10:30:00Z",
      },
      {
        sourceId: "new-age",
        headline: "Unverified posts claim a tiger was moved out of the Sundarbans",
        url: "https://www.newagebd.net/environment/sundarbans-tiger-survey",
        excerpt: "The census figure is published. This transfer claim is unverified.",
        publishedAt: "2026-11-11T09:50:00Z",
        isRumor: true,
      },
    ],
  },
  {
    slug: "dhaka-metro-weekend-crowds",
    title: "Weekend crowds pack the new Dhaka metro extension",
    titleBn: "সাপ্তাহিক ছুটিতে ঢাকার নতুন মেট্রো অংশে ভিড়",
    summary:
      "Ridership figures match across desks. Coverage splits on whether the line is a city convenience or a fare that still leaves many commuters out.",
    summaryBn:
      "যাত্রীসংখ্যা মিলছে। লাইনটা শহরের সুবিধা, নাকি ভাড়ায় অনেকে বাদ পড়ছে— খবর সেখানেই আলাদা।",
    category: "News",
    categoryBn: "সংবাদ",
    isBlindspot: false,
    updatedAt: "2026-11-11T08:20:00Z",
    perspectiveSummaries: {
      opposition:
        "Leads with fare complaints and stations that still lack last-mile buses.",
      neutral:
        "Reports weekend boardings, the new stops, and what the operator published.",
      establishment:
        "Presents the crowds as proof the extension was the right city project.",
      international:
        "Compares the opening weekend with other South Asian metro extensions.",
    },
    articles: [
      {
        sourceId: "manab-zamin",
        headline: "হতবাক! নতুন মেট্রোতে এমন ভিড় ঢাকা আগে দেখেনি",
        url: "https://mzamin.com/news/dhaka-metro-weekend",
        excerpt: "স্টেশনের ছবি ভাইরাল। যাত্রীসংখ্যার হিসাব এই খবরে নেই।",
        publishedAt: "2026-11-11T08:00:00Z",
      },
      {
        sourceId: "samakal",
        headline: "নতুন মেট্রো অংশে ভিড়, ফিডার বাস এখনো কম",
        url: "https://samakal.com/news/dhaka-metro-weekend",
        excerpt: "স্টেশনের বাইরে যাত্রীরা বলছেন, শেষ গন্তব্যে পৌঁছাতে বাস মিলছে না।",
        publishedAt: "2026-11-11T07:30:00Z",
      },
      {
        sourceId: "bdnews24",
        headline: "ছুটির দিনে নতুন মেট্রো অংশে যাত্রী বেড়েছে",
        url: "https://bdnews24.com/news/dhaka-metro-weekend",
        excerpt: "অপারেটরের হিসাবে শনি-রবিবারে ওই অংশে আগের সপ্তাহের চেয়ে বেশি বোর্ডিং।",
        publishedAt: "2026-11-11T07:05:00Z",
      },
      {
        sourceId: "daily-star",
        headline: "Unconfirmed claim says the new metro stops will close next week",
        url: "https://www.thedailystar.net/news/dhaka-metro-weekend",
        excerpt: "The operator has not confirmed any closure. Treat the post as unverified.",
        publishedAt: "2026-11-11T06:40:00Z",
        isRumor: true,
      },
    ],
  },
  {
    slug: "ec-poll-schedule-review",
    title: "Election Commission reviews the national poll schedule",
    titleBn: "নির্বাচন কমিশন জাতীয় নির্বাচনের সময়সূচি পর্যালোচনা করছে",
    summary:
      "Outlets agree a schedule review is underway, and split on whether it protects a fair vote or delays a ballot the government would rather postpone.",
    summaryBn:
      "সময়সূচি পর্যালোচনা চলছে— এতে সবাই একমত। এটা সুষ্ঠু ভোট নিশ্চিত করে, নাকি সরকার চাওয়া বিলম্ব, তা নিয়ে ভাগ।",
    category: "Politics",
    categoryBn: "রাজনীতি",
    isBlindspot: false,
    updatedAt: "2026-10-03T09:30:00Z",
    perspectiveSummaries: {
      establishment:
        "Frames the review as a routine step so every constituency can vote on time.",
      opposition:
        "Calls the review a delay tactic and asks the commission to publish a fixed date.",
      neutral:
        "Reports the commission notice, party reactions, and what the current schedule still says.",
      international:
        "Sets the review next to recent election-observer statements, without party labels.",
    },
    articles: [
      {
        sourceId: "jugantor",
        headline: "সুষ্ঠু ভোটের স্বার্থে সময়সূচি পর্যালোচনা করছে কমিশন",
        url: "https://www.jugantor.com/politics/ec-poll-schedule",
        excerpt: "সরকারি সূত্র বলছে, আসনভিত্তিক প্রস্তুতি শেষ করেই তারিখ চূড়ান্ত হবে।",
        publishedAt: "2026-10-03T08:10:00Z",
      },
      {
        sourceId: "samakal",
        headline: "তারিখ পেছানোর চেষ্টা, সময়সূচি এখনই প্রকাশ করুক কমিশন",
        url: "https://samakal.com/politics/ec-poll-schedule",
        excerpt: "নাম প্রকাশে অনিচ্ছুক এক বিরোধী নেতা বলছেন, পর্যালোচনার নামে ভোট আটকে রাখা হচ্ছে।",
        publishedAt: "2026-10-03T07:40:00Z",
      },
      {
        sourceId: "daily-star",
        headline: "EC notice confirms schedule review; parties wait on a date",
        url: "https://www.thedailystar.net/politics/ec-poll-schedule",
        excerpt: "Commission spokesman Anisul Karim said the published window is still under review.",
        publishedAt: "2026-10-03T07:05:00Z",
        perspective: "neutral",
      },
      {
        sourceId: "prothom-alo",
        headline: "নির্বাচন কমিশনের সময়সূচি পর্যালোচনা: যা এখনো স্পষ্ট নয়",
        url: "https://www.prothomalo.com/politics/ec-poll-schedule",
        excerpt: "সংশ্লিষ্ট সূত্র বলছে, নোটিশে পর্যালোচনার কথা আছে। তারিখ পাল্টাবে কি না, কমিশন তা বলেনি।",
        publishedAt: "2026-10-03T06:50:00Z",
        perspective: "neutral",
      },
      {
        sourceId: "bbc-bangla",
        headline: "বাংলাদেশে নির্বাচনের সময়সূচি নিয়ে কমিশনের নতুন পর্যালোচনা",
        url: "https://www.bbc.com/bengali/ec-poll-schedule",
        excerpt: "Sources say observer groups want the date fixed soon so preparations stay clear.",
        publishedAt: "2026-10-03T06:30:00Z",
      },
    ],
  },
  {
    slug: "padma-bridge-toll-revision",
    title: "Government proposes Padma Bridge toll revision amid commuter pushback",
    titleBn: "যাত্রীদের প্রতিবাদের মধ্যে পদ্মা সেতুতে ভাড়া বাড়ানোর প্রস্তাব",
    summary:
      "Multiple outlets agree tolls may rise, but disagree on whether the move is fiscally necessary or politically mistimed before local elections.",
    summaryBn:
      "সংবাদমাধ্যমগুলো ভাড়া বাড়তে পারে বলে মেনে নিলেও, স্থানীয় নির্বাচনের আগে এ সিদ্ধান্ত অর্থনৈতিক প্রয়োজন নাকি রাজনৈতিক — তা নিয়ে ভিন্নমত।",
    category: "Economy",
    categoryBn: "অর্থনীতি",
    isBlindspot: false,
    updatedAt: "2026-10-02T14:00:00Z",
    perspectiveSummaries: {
      establishment:
        "Frames the revision as essential maintenance funding and compares rates favorably with regional bridges.",
      opposition:
        "Highlights burden on daily wage earners and questions transparency of toll revenue use.",
      neutral:
        "Balances fiscal data with commuter interviews from Munshiganj and Shariatpur.",
      international:
        "Places the story in South Asia infrastructure financing context without domestic party labels.",
    },
    articles: [
      {
        sourceId: "jugantor",
        headline: "পদ্মা সেতুতে ভাড়া বাড়ানোর সিদ্ধান্ত জনকল্যাণমুখী: সংশ্লিষ্টরা",
        url: "https://www.jugantor.com/",
        excerpt: "সরকারি সূত্র বলছে, রক্ষণাবেক্ষণ খরচ মেটাতে সামান্য সমন্বয় অপরিহার্য।",
        publishedAt: "2026-10-02T11:20:00Z",
        framingNote: "Emphasizes official justification.",
      },
      {
        sourceId: "samakal",
        headline: "ভাড়া বাড়ানোর আগে জবাবদিহি চায় যাত্রীরা",
        url: "https://samakal.com/",
        excerpt: "মুন্সীগঞ্গের মাইক্রোবাস চালকরা বলছেন, আয়ের সঙ্গে সামঞ্জস্য নেই।",
        publishedAt: "2026-10-02T10:05:00Z",
        framingNote: "Leads with commuter hardship.",
      },
      {
        sourceId: "daily-star",
        headline: "Analysts split on timing of Padma toll hike proposal",
        url: "https://www.thedailystar.net/",
        excerpt: "Economists cite FX pressure; civil society groups demand published audit trails.",
        publishedAt: "2026-10-02T09:40:00Z",
        perspective: "neutral",
      },
      {
        sourceId: "bbc-bangla",
        headline: "পদ্মা সেতু: ভাড়া বাড়লে সবচেয়ে বেশি কাকে প্রভাবিত করবে?",
        url: "https://www.bbc.com/bengali",
        excerpt: "বাংলাদেশের গ্রামীণ-শহর সংযোগে সেতুর ভূমিকা এবং নতুন খরচের প্রভাব।",
        publishedAt: "2026-10-02T08:30:00Z",
      },
    ],
  },
  {
    slug: "dhaka-air-quality-winter",
    title: "Dhaka air quality worsens; schools debate outdoor activities",
    titleBn: "ঢাকার বায়ু দূষণ বেড়েছে; বিদ্যালয়গুলোতে বাইরের কার্যক্রম নিয়ে আলোচনা",
    summary:
      "AQI readings spike across the capital. Coverage converges on health risks but splits on whether industrial enforcement or vehicular policy should lead the response.",
    summaryBn:
      "রাজধানীতে AQI তীব্র। স্বাস্থ্যঝুঁকি নিয়ে একমত হলেও, শিল্পখাত নাকি যানজট— কোনটাকে আগে ঠেকাতে হবে তা নিয়ে ভিন্ন অ্যাঙ্গেল।",
    category: "Environment",
    categoryBn: "পরিবেশ",
    isBlindspot: false,
    updatedAt: "2026-10-02T06:00:00Z",
    perspectiveSummaries: {
      neutral:
        "Cites AQI monitors in Mirpur and Keraniganj; quotes pulmonologists on children's exposure.",
      opposition:
        "Attributes crisis to unplanned industrial units and weak enforcement in surrounding districts.",
      international:
        "Compares Dhaka rankings with Delhi and Lahore; mentions transboundary haze research.",
    },
    articles: [
      {
        sourceId: "prothom-alo",
        headline: "ঢাকার ১৫ এলাকায় 'অস্বাস্থ্যকর' বায়ু— বিশেষজ্ঞরা কী বলছেন",
        url: "https://www.prothomalo.com/",
        excerpt: "শিশু-কিশোরদের জন্য দীর্ঘ সময় বাইরে থাকা ঝুঁকিপূর্ণ বলে সতর্কতা।",
        publishedAt: "2026-10-02T05:10:00Z",
      },
      {
        sourceId: "new-age",
        headline: "Enforcement gaps fuel Dhaka's recurring smog season",
        url: "https://www.newagebd.net/",
        excerpt: "Activists point to brick kilns and unfit diesel fleets on key corridors.",
        publishedAt: "2026-10-02T04:55:00Z",
      },
      {
        sourceId: "dw-bangla",
        headline: "দক্ষিণ এশিয়ার শহরগুলোতে বায়ু দূষণ: ঢাকার অবস্থান",
        url: "https://www.dw.com/bn",
        excerpt: "আন্তর্জাতিক সূচকে ঢাকার অবনতি এবং স্থানীয় নীতির তুলনা।",
        publishedAt: "2026-10-02T04:20:00Z",
      },
    ],
  },
  {
    slug: "remittance-record-september",
    title: "September remittance inflow hits multi-year high",
    titleBn: "সেপ্টেম্বরে রেমিট্যান্স প্রবাহে বহু বছরের রেকর্ড",
    summary:
      "Bangladesh Bank data shows strong Gulf inflows. Business press celebrates reserves; some outlets warn dependency on single corridors.",
    summaryBn:
      "কেন্দ্রীয় ব্যাংকের তথ্যে উপসাগরীয় অঞ্চল থেকে প্রবাহ শক্তিশালী। ব্যবসায়িক সংবাদমাধ্যম রিজার্ভ উদযাপন করে; কেউ কেউ একক উৎসের ওপর নির্ভরতার ঝুঁকি তুলে ধরে।",
    category: "Economy",
    categoryBn: "অর্থনীতি",
    isBlindspot: false,
    updatedAt: "2026-10-01T18:00:00Z",
    perspectiveSummaries: {
      establishment:
        "Links inflow to government diaspora outreach and stable exchange policy.",
      neutral:
        "Reports figures with minimal editorial framing; includes BB press release quotes and migrant worker interviews.",
    },
    articles: [
      {
        sourceId: "financial-express",
        headline: "Remittance surge cushions import bill pressure",
        url: "https://thefinancialexpress.com.bd/",
        excerpt: "Bankers see Q4 comfort on external balance metrics.",
        publishedAt: "2026-10-01T16:00:00Z",
      },
      {
        sourceId: "bdnews24",
        headline: "সেপ্টেম্বরে রেমিট্যান্স ২.১ বিলিয়ন ডলার ছাড়াল",
        url: "https://bdnews24.com/",
        excerpt: "বাংলাদেশ ব্যাংকের প্রাথমিক হিসাব অনুযায়ী প্রবাহ বেড়েছে।",
        publishedAt: "2026-10-01T15:30:00Z",
      },
      {
        sourceId: "jugantor",
        headline: "রেমিট্যান্স রেকর্ড: সরকারের নীতিতে প্রবাসীদের আস্থা বাড়ছে",
        url: "https://www.jugantor.com/",
        excerpt: "দেশের অর্থনীতিতে ইতিবাচক প্রভাব— সরকারি মুখপাত্র।",
        publishedAt: "2026-10-01T14:45:00Z",
      },
    ],
  },
  {
    slug: "tigers-asia-cup-semifinal",
    title: "Tigers reach Asia Cup semifinal after tense chase",
    titleBn: "উত্তেজনাপূর্ণ জয়ের পর এশিয়া কাপ সেমিফাইনালে বাংলাদেশ",
    summary:
      "Sports desks align on match facts; debate centers on middle-order stability and selection calls.",
    summaryBn:
      "ম্যাচের তথ্যে একমত; মধ্য-অর্ডার ও দল ঘোষণা নিয়ে ভিন্ন বিশ্লেষণ।",
    category: "Sports",
    categoryBn: "খেলা",
    isBlindspot: false,
    updatedAt: "2026-10-01T22:00:00Z",
    perspectiveSummaries: {
      neutral:
        "Straight match reports and analytical pieces on bowling depth and fielding metrics.",
    },
    articles: [
      {
        sourceId: "bdnews24",
        headline: "বাংলাদেশ এশিয়া কাপের শেষ চারে",
        url: "https://bdnews24.com/",
        excerpt: "Hassan Mahmud finishes with three wickets in the death overs.",
        publishedAt: "2026-10-01T21:10:00Z",
      },
      {
        sourceId: "daily-star",
        headline: "Middle order steadies ship in Dubai chase",
        url: "https://www.thedailystar.net/",
        excerpt: "Selection panel likely to face questions if top order stalls again.",
        publishedAt: "2026-10-01T21:00:00Z",
      },
      {
        sourceId: "manab-zamin",
        headline: "টাইগাররা সেমিফাইনালে: ফ্যানদের উল্লাস",
        url: "https://mzamin.com/",
        excerpt: "ঢাকা ও চট্টগ্রামে উচ্ছ্বাসের ছবি।",
        publishedAt: "2026-10-01T20:50:00Z",
      },
    ],
  },
];

export const DEMO_STORIES: Story[] = withDemoArticleImages(DEMO_STORIES_BASE);

export function getSourceById(id: string): NewsSource | undefined {
  return BD_SOURCES.find((s) => s.id === id);
}

export function getStoryBySlug(slug: string): Story | undefined {
  return DEMO_STORIES.find((s) => s.slug === slug);
}

/** Shown on /rumors when the API is empty or unreachable. */
export const DEMO_RUMOR_ARTICLES: Article[] = [
  {
    id: 9001,
    source_id: 0,
    cluster_id: null,
    title: "Social posts claim nationwide mobile network shutdown — outlets have not confirmed",
    url: "https://www.thedailystar.net/",
    excerpt: "Treat as unverified until multiple independent sources report the same restriction.",
    published_at: "2026-10-02T08:00:00Z",
    is_rumor: true,
  },
  {
    id: 9002,
    source_id: 0,
    cluster_id: null,
    title: "ভাইরাল পোস্টে ‘জরুরি নগদ বোনাস’ লিংক — কোনো ব্যাংক এমন ঘোষণা দেয়নি",
    url: "https://www.prothomalo.com/",
    excerpt: "ফ্যাক্টচেক করুন; শেয়ার করার আগে সরকারি বা প্রতিষ্ঠানের সাইট যাচাই করুন।",
    published_at: "2026-10-01T14:30:00Z",
    is_rumor: true,
  },
];
