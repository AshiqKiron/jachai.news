from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser
import httpx

from app.core.config import settings


@dataclass
class ParsedFeedItem:
    title: str
    url: str
    excerpt: str | None
    published_at: datetime | None


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
        items.append(
            ParsedFeedItem(
                title=title.strip(),
                url=link.strip(),
                excerpt=excerpt.strip() if isinstance(excerpt, str) else None,
                published_at=published_at,
            )
        )
    return items
