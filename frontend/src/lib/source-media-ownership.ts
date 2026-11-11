/** Publisher / parent company for known outlets (seed RSS names). */
export type MediaOwnerLink = {
  name: string;
  url: string;
};

export type MediaOwnership = {
  /** Direct publisher or operating company */
  owner: MediaOwnerLink;
  /** Corporate parent when distinct from the operating company */
  parent?: MediaOwnerLink;
};

const OWNERSHIP_BY_SOURCE_NAME: Record<string, MediaOwnership> = {
  "Prothom Alo": {
    owner: {
      name: "Mediastar Limited",
      url: "https://www.transcombd.com/businesses/media/mediastar/",
    },
    parent: {
      name: "Transcom Group",
      url: "https://www.transcombd.com/",
    },
  },
  "The Daily Star": {
    owner: {
      name: "Mediaworld Limited",
      url: "https://www.thedailystar.net/about-us",
    },
    parent: {
      name: "Transcom Group",
      url: "https://www.transcombd.com/",
    },
  },
  "bdnews24.com": {
    owner: {
      name: "Bangladesh News 24 Hours Ltd.",
      url: "https://en.wikipedia.org/wiki/Bdnews24.com",
    },
  },
  Jugantor: {
    owner: {
      name: "Jamuna Printing and Publishing Ltd.",
      url: "https://jamunagroup.com.bd/companies/21/THE-DAILY-JUGANTOR",
    },
    parent: {
      name: "Jamuna Group",
      url: "https://jamunagroup.com.bd/",
    },
  },
  "Dhaka Tribune": {
    owner: { name: "2A Media Limited", url: "https://www.dhakatribune.com/" },
    parent: { name: "Gemcon Group", url: "https://gemcongroup.com/" },
  },
  "Bangla Tribune": {
    owner: { name: "2A Media Limited", url: "https://www.banglatribune.com/" },
    parent: { name: "Gemcon Group", url: "https://gemcongroup.com/" },
  },
  "The Business Standard": {
    owner: {
      name: "The Horizon Media and Publication Ltd.",
      url: "https://www.tbsnews.net/about-us",
    },
    parent: { name: "Orion Group", url: "https://www.orion-group.net/" },
  },
  "Ajker Patrika": {
    owner: {
      name: "Bijoy Bangla Media Limited",
      url: "https://www.ajkerpatrika.com/about-us",
    },
    parent: {
      name: "US-Bangla Group",
      url: "https://www.usbassets.com/about/us-bangla-group/",
    },
  },
  "Dhaka Post": {
    owner: {
      name: "Bijoy Bangla Media Limited",
      url: "https://www.dhakapost.com/about-us",
    },
    parent: {
      name: "US-Bangla Group",
      url: "https://www.usbassets.com/about/us-bangla-group/",
    },
  },
  Jagonews24: {
    owner: { name: "AKC (Pvt.) Ltd.", url: "https://www.jagonews24.com/" },
  },
  "Kaler Kantho": {
    owner: { name: "East West Media Group PLC", url: "https://ewmgl.com/" },
    parent: { name: "Bashundhara Group", url: "https://www.bashundharagroup.com/" },
  },
  "The Daily Ittefaq": {
    owner: {
      name: "Ittefaq Group of Publications Ltd.",
      url: "https://www.ittefaq.com.bd/",
    },
  },
  "The New Nation": {
    owner: {
      name: "Ittefaq Group of Publications Ltd.",
      url: "https://www.ittefaq.com.bd/",
    },
  },
  "Somoy News": {
    owner: { name: "Somoy Media Limited", url: "https://www.somoynews.tv/" },
    parent: { name: "City Group", url: "https://www.citygroup.com.bd/" },
  },
  "Channel i Online": {
    owner: { name: "Impress Group", url: "https://www.impress-group.org/" },
  },
  "Bangladesh Journal": {
    owner: { name: "Anwar Hossain Khan", url: "https://www.bd-journal.com/" },
  },
  "Bangladesh Diplomat": {
    owner: { name: "Monjurul Islam Joy", url: "https://bangladeshdiplomat.com/about-us/" },
  },
  "Energy Bangla": {
    owner: { name: "Energy Bangla Limited", url: "https://energybangla.com/" },
  },
  BD24Live: {
    owner: { name: "BD24Live Media (Pvt.) Ltd.", url: "https://www.bd24live.com/" },
  },
  Risingbd: {
    owner: { name: "Skyroute Media Limited", url: "https://www.risingbd.com/" },
  },
  "Weekly Blitz": {
    owner: {
      name: "Salah Uddin Shoaib Choudhury",
      url: "https://weeklyblitz.net/about-us/",
    },
  },
  "Sangbad Pratidin": {
    owner: {
      name: "Pratidin Prakashani Pvt. Ltd.",
      url: "https://www.sangbadpratidin.in/about-us/",
    },
  },
  Samakal: {
    owner: {
      name: "Times Media Ltd.",
      url: "https://samakal.com/",
    },
    parent: {
      name: "Ha-Meem Group",
      url: "https://www.hameemgroup.net/",
    },
  },
  "BBC Bangla": {
    owner: {
      name: "BBC World Service",
      url: "https://www.bbc.com/bengali",
    },
    parent: {
      name: "British Broadcasting Corporation (BBC)",
      url: "https://www.bbc.co.uk/aboutthebbc",
    },
  },
  "The Financial Express": {
    owner: {
      name: "International Publications Limited",
      url: "https://thefinancialexpress.com.bd/",
    },
  },
};

function normalizeSourceName(name: string): string {
  return name.trim().toLowerCase();
}

const OWNERSHIP_LOOKUP = new Map<string, MediaOwnership>(
  Object.entries(OWNERSHIP_BY_SOURCE_NAME).map(([name, row]) => [
    normalizeSourceName(name),
    row,
  ]),
);

/** Builds an ownership link from API fields. Empty owner name or URL returns null. */
export function mediaOwnershipFromLinks(
  ownerName?: string | null,
  ownerUrl?: string | null,
  parentName?: string | null,
  parentUrl?: string | null,
): MediaOwnership | null {
  const name = ownerName?.trim() ?? "";
  const url = ownerUrl?.trim() ?? "";
  if (!name || !url) return null;
  const parentLabel = parentName?.trim() ?? "";
  const parentHref = parentUrl?.trim() ?? "";
  return {
    owner: { name, url },
    ...(parentLabel && parentHref ? { parent: { name: parentLabel, url: parentHref } } : {}),
  };
}

/** Returns ownership metadata for a known outlet name, or null for custom/unknown feeds. */
export function lookupMediaOwnership(sourceName: string): MediaOwnership | null {
  const key = normalizeSourceName(sourceName);
  if (!key) return null;
  const exact = OWNERSHIP_LOOKUP.get(key);
  if (exact) return exact;
  let best: MediaOwnership | null = null;
  let bestLength = 0;
  for (const [name, row] of OWNERSHIP_LOOKUP) {
    const prefixed = key.startsWith(`${name} `) || key.startsWith(`${name}(`);
    if (prefixed && name.length > bestLength) {
      best = row;
      bestLength = name.length;
    }
  }
  return best;
}
