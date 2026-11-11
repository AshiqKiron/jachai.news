/** @typedef {{ id: string, label: string, url: string }} BdFeed */

/**
 * Verified Bangladesh news RSS feeds bundled with the collector.
 * These show up in the section checklist and are enabled by default so a
 * fresh install downloads articles from every source out of the box.
 * Keep ids stable — they key the enable/disable map and the per-feed files.
 * @type {BdFeed[]}
 */
export const BD_NEWS_FEEDS = [
  // Prothom Alo (direct section feeds, Bangla + English)
  {
    id: "pa-bn-latest",
    label: "Prothom Alo — Latest (BN)",
    url: "https://www.prothomalo.com/feed/",
  },
  {
    id: "pa-bn-bangladesh",
    label: "Prothom Alo — Bangladesh (BN)",
    url: "https://www.prothomalo.com/bangladesh/feed/",
  },
  {
    id: "pa-bn-economy",
    label: "Prothom Alo — Economy (BN)",
    url: "https://www.prothomalo.com/economy/feed/",
  },
  {
    id: "pa-bn-entertainment",
    label: "Prothom Alo — Entertainment (BN)",
    url: "https://www.prothomalo.com/entertainment/feed/",
  },
  {
    id: "pa-en-latest",
    label: "Prothom Alo — Latest (EN)",
    url: "https://en.prothomalo.com/stories.rss",
  },
  {
    id: "pa-en-bangladesh",
    label: "Prothom Alo — Bangladesh (EN)",
    url: "https://en.prothomalo.com/bangladesh/rss.xml",
  },
  {
    id: "pa-en-business",
    label: "Prothom Alo — Business (EN)",
    url: "https://en.prothomalo.com/business/rss.xml",
  },
  {
    id: "pa-en-corporate",
    label: "Prothom Alo — Corporate (EN)",
    url: "https://en.prothomalo.com/corporate/rss.xml",
  },
  {
    id: "pa-en-youth",
    label: "Prothom Alo — Youth (EN)",
    url: "https://en.prothomalo.com/youth/rss.xml",
  },

  // The Daily Star
  {
    id: "dailystar-top",
    label: "The Daily Star — Top",
    url: "https://www.thedailystar.net/taxonomy/term/1/rss.xml",
  },
  {
    id: "dailystar-bangladesh",
    label: "The Daily Star — Bangladesh",
    url: "https://www.thedailystar.net/news/bangladesh/rss.xml",
  },
  {
    id: "dailystar-business",
    label: "The Daily Star — Business",
    url: "https://www.thedailystar.net/business/rss.xml",
  },
  {
    id: "dailystar-tech-startup",
    label: "The Daily Star — Tech & Startup",
    url: "https://www.thedailystar.net/tech-startup/rss.xml",
  },
  {
    id: "dailystar-opinion",
    label: "The Daily Star — Opinion",
    url: "https://www.thedailystar.net/opinion/rss.xml",
  },
  {
    id: "dailystar-sports",
    label: "The Daily Star — Sports",
    url: "https://www.thedailystar.net/sports/rss.xml",
  },

  // The Business Standard (TBS)
  {
    id: "tbs-latest",
    label: "TBS News — Latest",
    url: "https://www.tbsnews.net/rss.xml",
  },
  {
    id: "tbs-economy",
    label: "TBS News — Economy",
    url: "https://www.tbsnews.net/economy/rss.xml",
  },
  {
    id: "tbs-companies",
    label: "TBS News — Companies",
    url: "https://www.tbsnews.net/bangladesh/companies/rss.xml",
  },
  {
    id: "tbs-tech-startup",
    label: "TBS News — Tech & Startup",
    url: "https://www.tbsnews.net/tech-and-startup/rss.xml",
  },

  // Jagonews24
  {
    id: "jagonews-latest",
    label: "Jagonews24 — Latest",
    url: "https://www.jagonews24.com/rss/rss.xml",
  },
  {
    id: "jagonews-national",
    label: "Jagonews24 — National",
    url: "https://www.jagonews24.com/rss/national.xml",
  },
  {
    id: "jagonews-politics",
    label: "Jagonews24 — Politics",
    url: "https://www.jagonews24.com/rss/politics.xml",
  },
  {
    id: "jagonews-economy",
    label: "Jagonews24 — Economy",
    url: "https://www.jagonews24.com/rss/economy.xml",
  },
  {
    id: "jagonews-sports",
    label: "Jagonews24 — Sports",
    url: "https://www.jagonews24.com/rss/sports.xml",
  },

  // Jugantor
  {
    id: "jugantor-latest",
    label: "Jugantor — Latest",
    url: "https://www.jugantor.com/feed/rss.xml",
  },
  {
    id: "jugantor-national",
    label: "Jugantor — National",
    url: "https://www.jugantor.com/national/feed/rss.xml",
  },
  {
    id: "jugantor-economics",
    label: "Jugantor — Economics",
    url: "https://www.jugantor.com/economics/feed/rss.xml",
  },
  {
    id: "jugantor-sports",
    label: "Jugantor — Sports",
    url: "https://www.jugantor.com/sports/feed/rss.xml",
  },

  // Single-feed outlets
  {
    id: "banglatribune",
    label: "Bangla Tribune",
    url: "https://www.banglatribune.com/feed/",
  },
  {
    id: "bd-journal",
    label: "Bangladesh Journal",
    url: "https://www.bd-journal.com/feed/latest-rss.xml",
  },
  {
    id: "bangladesh-diplomat",
    label: "Bangladesh Diplomat",
    url: "https://bangladeshdiplomat.com/feed/",
  },
  {
    id: "weekly-blitz",
    label: "Weekly Blitz",
    url: "https://weeklyblitz.net/feed/",
  },
  {
    id: "energy-bangla",
    label: "Energy Bangla",
    url: "https://energybangla.com/feed/",
  },
  {
    id: "energy-bangla-bd",
    label: "Energy Bangla (.com.bd)",
    url: "https://energybangla.com.bd/feed/",
  },
  {
    id: "bd24live",
    label: "BD24Live (BN)",
    url: "https://www.bd24live.com/bangla/feed",
  },
  {
    id: "risingbd",
    label: "Risingbd",
    url: "https://www.risingbd.com/rss/rss.xml",
  },
  {
    id: "channeli-online",
    label: "Channel i Online",
    url: "https://www.channelionline.com/rss.xml",
  },
  {
    id: "ajker-patrika",
    label: "Ajker Patrika",
    url: "https://www.ajkerpatrika.com/feed",
  },
  {
    id: "bbc-bangla",
    label: "BBC Bangla",
    url: "https://feeds.bbci.co.uk/bengali/rss.xml",
  },
  {
    id: "dhaka-tribune",
    label: "Dhaka Tribune",
    url: "https://www.dhakatribune.com/feed/",
  },
  {
    id: "new-nation",
    label: "The New Nation",
    url: "https://www.newnationbd.com/feed/",
  },
  {
    id: "sangbad-pratidin",
    label: "Sangbad Pratidin",
    url: "https://www.sangbadpratidin.in/feed/",
  },

  // Google News site searches (outlets without a reliable native RSS)
  {
    id: "gnews-kalerkantho",
    label: "Kaler Kantho (Google News)",
    url: "https://news.google.com/rss/search?q=site:kalerkantho.com&hl=en-US&gl=US&ceid=US:en",
  },
  {
    id: "gnews-dhakatribune",
    label: "Dhaka Tribune (Google News)",
    url: "https://news.google.com/rss/search?q=site:dhakatribune.com",
  },
  {
    id: "gnews-ittefaq",
    label: "Ittefaq (Google News)",
    url: "https://news.google.com/rss/search?q=site:ittefaq.com.bd",
  },
  {
    id: "gnews-financialexpress",
    label: "The Financial Express (Google News)",
    url: "https://news.google.com/rss/search?q=site:thefinancialexpress.com.bd",
  },
  {
    id: "gnews-samakal",
    label: "Samakal (Google News)",
    url: "https://news.google.com/rss/search?q=site:samakal.com",
  },
  {
    id: "gnews-somoynews",
    label: "Somoy News (Google News)",
    url: "https://news.google.com/rss/search?q=site:somoynews.tv",
  },
  {
    id: "gnews-dhakapost",
    label: "Dhaka Post (Google News)",
    url: "https://news.google.com/rss/search?q=site:dhakapost.com&hl=en-US&gl=US&ceid=US:en",
  },
];

/** Stable ids of bundled BD feeds — used for enabled-by-default resolution. */
export const BD_NEWS_FEED_ID_SET = new Set(BD_NEWS_FEEDS.map((f) => f.id));
