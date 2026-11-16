import re
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from typing import Any

import feedparser
import httpx

from app.core.config import settings

IMAGE_SRC_RE = re.compile(r"""<img[^>]+src=["']([^"']+)["']""", re.IGNORECASE)

# Some outlets 301/302 their feed paths to a canonical URL and/or block the
# default httpx User-Agent with a 403. Follow redirects and present a common
# browser UA so server-side pulls match what a browser sees.
_FEED_REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
}


@dataclass
class ParsedFeedItem:
    title: str
    url: str
    excerpt: str | None
    image_url: str | None
    published_at: datetime | None
    rss_guid: str | None = None
    author: str | None = None
    section: str | None = None
    tags: tuple[str, ...] = ()
    body_text: str | None = None


def _normalize_image_url(url: str | None) -> str | None:
    if not url:
        return None
    cleaned = url.strip()
    if cleaned.startswith("//"):
        cleaned = f"https:{cleaned}"
    if not cleaned.startswith(("http://", "https://")):
        return None
    return cleaned[:2048]


def _image_from_html(html: str | None) -> str | None:
    if not html:
        return None
    match = IMAGE_SRC_RE.search(unescape(html))
    if not match:
        return None
    return _normalize_image_url(match.group(1))


def _media_dict_url(item: Any) -> str | None:
    if not isinstance(item, dict):
        return None
    raw = item.get("url") or item.get("href")
    return _normalize_image_url(str(raw)) if raw else None


def extract_entry_image_url(entry: Any, excerpt: str | None) -> str | None:
    media_content = getattr(entry, "media_content", None) or []
    for item in media_content:
        if not isinstance(item, dict):
            continue
        media_type = (item.get("type") or item.get("medium") or "").lower()
        url = _media_dict_url(item)
        if url and (not media_type or media_type.startswith("image") or "image" in media_type):
            return url

    media_thumbnail = getattr(entry, "media_thumbnail", None) or []
    for item in media_thumbnail:
        url = _media_dict_url(item)
        if url:
            return url

    for link in getattr(entry, "links", None) or []:
        if not isinstance(link, dict):
            continue
        link_type = (link.get("type") or "").lower()
        rel = (link.get("rel") or "").lower()
        href = link.get("href")
        if href and link_type.startswith("image"):
            return _normalize_image_url(str(href))
        if href and rel == "enclosure" and link_type.startswith("image"):
            return _normalize_image_url(str(href))

    enclosures = getattr(entry, "enclosures", None) or []
    for enc in enclosures:
        if not isinstance(enc, dict):
            continue
        enc_type = (enc.get("type") or "").lower()
        href = enc.get("href") or enc.get("url")
        if href and enc_type.startswith("image"):
            return _normalize_image_url(str(href))

    return _image_from_html(excerpt)


def _entry_author(entry: Any) -> str | None:
    author = getattr(entry, "author", None)
    if isinstance(author, str) and author.strip():
        return author.strip()[:512]
    authors = getattr(entry, "authors", None) or []
    if authors and isinstance(authors[0], dict):
        name = authors[0].get("name") or authors[0].get("email")
        if isinstance(name, str) and name.strip():
            return name.strip()[:512]
    return None


def _entry_tags(entry: Any) -> tuple[str, ...]:
    tags: list[str] = []
    for tag in getattr(entry, "tags", None) or []:
        if not isinstance(tag, dict):
            continue
        term = tag.get("term") or tag.get("label")
        if isinstance(term, str) and term.strip():
            tags.append(term.strip()[:120])
    return tuple(tags[:12])


def _entry_section(entry: Any) -> str | None:
    tags = getattr(entry, "tags", None) or []
    for tag in tags:
        if not isinstance(tag, dict):
            continue
        label = tag.get("label")
        if isinstance(label, str) and label.strip():
            return label.strip()[:255]
    category = getattr(entry, "category", None)
    if isinstance(category, str) and category.strip():
        return category.strip()[:255]
    return None


def _entry_guid(entry: Any) -> str | None:
    guid = getattr(entry, "id", None) or getattr(entry, "guid", None)
    if isinstance(guid, str) and guid.strip():
        return guid.strip()[:512]
    return None


def _entry_body_text(entry: Any, excerpt: str | None) -> str | None:
    from app.services.article_enrichment import strip_html_to_text

    content = getattr(entry, "content", None) or []
    for block in content:
        if not isinstance(block, dict):
            continue
        value = block.get("value")
        if isinstance(value, str) and value.strip():
            parsed = strip_html_to_text(value)
            if parsed:
                return parsed
    return strip_html_to_text(excerpt)


async def fetch_feed_items(feed_url: str) -> list[ParsedFeedItem]:
    async with httpx.AsyncClient(
        timeout=settings.rss_fetch_timeout_seconds,
        follow_redirects=True,
        headers=_FEED_REQUEST_HEADERS,
    ) as client:
        response = await client.get(feed_url)
        response.raise_for_status()
        parsed = feedparser.parse(response.text)

    items: list[ParsedFeedItem] = []
    for entry in parsed.entries:
        link = getattr(entry, "link", None)
        title = getattr(entry, "title", None)
        if not link or not title:
            continue

        published_at: datetime | None = None
        if published := getattr(entry, "published", None):
            try:
                published_at = parsedate_to_datetime(published)
                if published_at.tzinfo is None:
                    published_at = published_at.replace(tzinfo=timezone.utc)
            except (TypeError, ValueError):
                published_at = None

        excerpt = getattr(entry, "summary", None) or getattr(entry, "description", None)
        excerpt_text = excerpt.strip() if isinstance(excerpt, str) else None
        items.append(
            ParsedFeedItem(
                title=title.strip(),
                url=link.strip(),
                excerpt=excerpt_text,
                image_url=extract_entry_image_url(entry, excerpt_text),
                published_at=published_at,
                rss_guid=_entry_guid(entry),
                author=_entry_author(entry),
                section=_entry_section(entry),
                tags=_entry_tags(entry),
                body_text=_entry_body_text(entry, excerpt_text),
            )
        )
    return items
