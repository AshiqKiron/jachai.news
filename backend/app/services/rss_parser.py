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


@dataclass
class ParsedFeedItem:
    title: str
    url: str
    excerpt: str | None
    image_url: str | None
    published_at: datetime | None


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


async def fetch_feed_items(feed_url: str) -> list[ParsedFeedItem]:
    async with httpx.AsyncClient(timeout=settings.rss_fetch_timeout_seconds) as client:
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
            )
        )
    return items
