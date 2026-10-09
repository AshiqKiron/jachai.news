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
      name: "East West Media Group Ltd.",
      url: "https://www.ewmg.com.bd/",
    },
    parent: {
      name: "Bashundhara Group",
      url: "https://www.bashundharagroup.com/",
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

/** Returns ownership metadata for a known outlet name, or null for custom/unknown feeds. */
export function lookupMediaOwnership(sourceName: string): MediaOwnership | null {
  const key = normalizeSourceName(sourceName);
  if (!key) return null;
  return OWNERSHIP_LOOKUP.get(key) ?? null;
}
