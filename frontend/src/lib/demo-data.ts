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
  imageUrl?: string;
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
