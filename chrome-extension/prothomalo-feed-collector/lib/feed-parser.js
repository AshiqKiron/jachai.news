/**
 * RSS 2.0 + Atom feed parser (no DOMParser in MV3 service workers).
 * @param {string} xmlText
 * @returns {Array<{ title: string, link: string, pubDate: string, imageUrl: string, categories: string[] }>}
 */
export function parseProthomAloFeed(xmlText, options = {}) {
  const allowEmpty = options.allowEmpty === true;
  if (!xmlText?.trim()) {
    throw new Error("Empty feed response");
  }

  const isRss = /<\s*rss[\s>]/i.test(xmlText);
  const isAtom = /<\s*feed[\s>]/i.test(xmlText);
  if (!isRss && !isAtom) {
    throw new Error(
      "Not RSS or Atom XML — use a direct feed URL (often ends in .rss, /feed, or /rss.xml), not a news homepage.",
    );
  }

  const blockRegex = isRss
    ? /<item\b[^>]*>([\s\S]*?)<\/item>/gi
    : /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;

  const items = [];
  let match = blockRegex.exec(xmlText);
  while (match) {
    const block = match[1];
    const parsed = parseFeedBlock(block, isAtom);
    if (parsed.link || parsed.title) {
      items.push(parsed);
    }
    match = blockRegex.exec(xmlText);
  }

  if (items.length === 0 && !allowEmpty) {
    throw new Error("No articles found in feed XML");
  }

  return items;
}

/**
 * @param {string} block
 * @param {boolean} isAtom
 */
function parseFeedBlock(block, isAtom) {
  const title =
    extractTagText(block, "title") ||
    extractTagText(block, "media:title") ||
    extractTagText(block, "dc:title");

  const link = isAtom ? extractAtomLink(block) : extractRssLink(block);
  const pubDate =
    extractTagText(block, "pubDate") ||
    extractTagText(block, "published") ||
    extractTagText(block, "updated") ||
    extractTagText(block, "dc:date");

  return {
    title,
    link,
    pubDate,
    imageUrl: extractImageUrl(block),
    categories: extractCategories(block),
  };
}

function extractRssLink(block) {
  const textLink = extractTagText(block, "link");
  if (textLink && /^https?:\/\//i.test(textLink)) {
    return textLink;
  }

  const hrefLink = extractLinkHref(block, "link");
  if (hrefLink) return hrefLink;

  const guidPerma = block.match(
    /<guid\b[^>]*\bisPermaLink=["']true["'][^>]*>([\s\S]*?)<\/guid>/i,
  );
  if (guidPerma) {
    const url = decodeXmlEntities(stripTags(guidPerma[1]).trim());
    if (/^https?:\/\//i.test(url)) return url;
  }

  return textLink;
}

function extractAtomLink(block) {
  const alternate = block.match(
    /<link\b[^>]*\brel=["']alternate["'][^>]*\bhref=["']([^"']+)["']/i,
  );
  if (alternate?.[1]) return decodeXmlEntities(alternate[1].trim());

  const alternateHrefFirst = block.match(
    /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']alternate["']/i,
  );
  if (alternateHrefFirst?.[1]) return decodeXmlEntities(alternateHrefFirst[1].trim());

  const anyHref = extractLinkHref(block, "link");
  if (anyHref) return anyHref;

  const id = extractTagText(block, "id");
  if (id && /^https?:\/\//i.test(id)) return id;

  return "";
}

function extractLinkHref(block, tag) {
  const re = new RegExp(
    `<${tag}\\b[^>]*\\bhref=["']([^"']+)["'][^>]*\\/?>`,
    "i",
  );
  const found = block.match(re);
  return found?.[1] ? decodeXmlEntities(found[1].trim()) : "";
}

function extractCategories(block) {
  const categories = [];
  const re = /<category\b[^>]*(?:>([\s\S]*?)<\/category>|\bterm=["']([^"']+)["'])/gi;
  let m = re.exec(block);
  while (m) {
    const text = decodeXmlEntities(
      stripTags(m[1] ?? "").trim() || (m[2] ?? "").trim(),
    );
    if (text) categories.push(text);
    m = re.exec(block);
  }
  return categories;
}

/**
 * @param {string} block
 * @param {string} tag
 */
function extractTagText(block, tag) {
  const re = new RegExp(
    `<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i",
  );
  const found = block.match(re);
  if (!found) return "";

  let inner = found[1].trim();
  const cdata = inner.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i);
  if (cdata) inner = cdata[1];

  return decodeXmlEntities(stripTags(inner).trim());
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "");
}

function extractImageUrl(block) {
  const content = block.match(
    /<media:content\b[^>]*\burl=["']([^"']+)["']/i,
  );
  if (content?.[1]) return content[1];

  const thumb = block.match(
    /<media:thumbnail\b[^>]*\burl=["']([^"']+)["']/i,
  );
  if (thumb?.[1]) return thumb[1];

  const img = block.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  return img?.[1] ?? "";
}

function decodeXmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    );
}
