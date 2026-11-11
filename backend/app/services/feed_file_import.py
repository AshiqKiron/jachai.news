"""Parse uploaded RSS/JSON feed files and persist articles (same clustering as RSS pull)."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.source import Source
from app.services.rss_parser import ParsedFeedItem
from app.services.rss_ingestion import IngestResult, persist_feed_items

logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
ALLOWED_SUFFIXES = (".json", ".xml", ".rss", ".csv")


def _parse_published(value: str | None) -> datetime | None:
    if not value or not isinstance(value, str):
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    try:
        published = parsedate_to_datetime(cleaned)
        if published.tzinfo is None:
            published = published.replace(tzinfo=timezone.utc)
        return published
    except (TypeError, ValueError):
        pass
    try:
        if cleaned.endswith("Z"):
            cleaned = f"{cleaned[:-1]}+00:00"
        published = datetime.fromisoformat(cleaned)
        if published.tzinfo is None:
            published = published.replace(tzinfo=timezone.utc)
        return published
    except ValueError:
        return None


def _normalize_json_row(row: object) -> ParsedFeedItem | None:
    if not isinstance(row, dict):
        return None
    title = (row.get("title") or row.get("headline") or "").strip()
    url = (row.get("link") or row.get("url") or row.get("articleUrl") or "").strip()
    if not title or not url:
        return None
    excerpt = row.get("excerpt") or row.get("summary") or row.get("description")
    excerpt_text = excerpt.strip() if isinstance(excerpt, str) and excerpt.strip() else None
    image = row.get("imageUrl") or row.get("image_url") or row.get("image")
    image_url = image.strip() if isinstance(image, str) and image.strip() else None
    pub = row.get("pubDate") or row.get("published_at") or row.get("publishedAt")
    pub_text = pub.strip() if isinstance(pub, str) else None
    return ParsedFeedItem(
        title=title,
        url=url,
        excerpt=excerpt_text,
        image_url=image_url,
        published_at=_parse_published(pub_text),
    )


def _items_from_json_payload(data: object) -> list[ParsedFeedItem]:
    rows: list[object]
    if isinstance(data, list):
        rows = data
    elif isinstance(data, dict):
        nested = data.get("articles") or data.get("items") or data.get("entries")
        rows = nested if isinstance(nested, list) else []
    else:
        return []

    items: list[ParsedFeedItem] = []
    for row in rows:
        parsed = _normalize_json_row(row)
        if parsed:
            items.append(parsed)
    return items


def _items_from_feed_xml(text: str) -> list[ParsedFeedItem]:
    parsed = feedparser.parse(text)
    items: list[ParsedFeedItem] = []
    for entry in parsed.entries:
        link = getattr(entry, "link", None)
        title = getattr(entry, "title", None)
        if not link or not title:
            continue
        excerpt = getattr(entry, "summary", None) or getattr(entry, "description", None)
        excerpt_text = excerpt.strip() if isinstance(excerpt, str) else None
        published_at = None
        if published := getattr(entry, "published", None):
            published_at = _parse_published(str(published))
        image_url = None
        for key in ("image_url", "image"):
            raw = getattr(entry, key, None)
            if isinstance(raw, str) and raw.strip():
                image_url = raw.strip()[:2048]
                break
        items.append(
            ParsedFeedItem(
                title=title.strip(),
                url=link.strip(),
                excerpt=excerpt_text,
                image_url=image_url,
                published_at=published_at,
            )
        )
    return items


def parse_uploaded_feed_file(content: bytes, filename: str) -> list[ParsedFeedItem]:
    if len(content) > MAX_UPLOAD_BYTES:
        raise ValueError(f"File too large (max {MAX_UPLOAD_BYTES // (1024 * 1024)} MB).")

    lowered = (filename or "").lower()
    text = content.decode("utf-8-sig", errors="replace").strip()
    if not text:
        raise ValueError("File is empty.")

    if lowered.endswith(".json") or text.startswith(("[", "{")):
        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            raise ValueError("Invalid JSON feed file.") from exc
        items = _items_from_json_payload(data)
        if not items:
            raise ValueError("No articles with title + link found in JSON.")
        return items

    if (
        lowered.endswith((".xml", ".rss"))
        or "<rss" in text[:4000].lower()
        or "<feed" in text[:4000].lower()
    ):
        items = _items_from_feed_xml(text)
        if not items:
            raise ValueError("No articles found in RSS/Atom XML.")
        return items

    raise ValueError(
        "Unsupported file type. Upload .json (extension export), .rss, or .xml feed files."
    )


async def import_feed_file_for_source(
    session: AsyncSession,
    source: Source,
    content: bytes,
    filename: str,
) -> IngestResult:
    items = parse_uploaded_feed_file(content, filename)
    result = IngestResult(sources_processed=1, articles_fetched=len(items))
    await persist_feed_items(session, source, items, result)
    return result
