"""How a source gets articles: live RSS URL vs admin file upload (swap to RSS later)."""

from __future__ import annotations

from typing import TYPE_CHECKING

FILE_INGEST_PLACEHOLDER_URL = "https://import.shorup.local/file-pending"

INGEST_MODE_RSS = "rss"
INGEST_MODE_FILE = "file"


def is_placeholder_feed_url(feed_url: str) -> bool:
    normalized = feed_url.strip().rstrip("/")
    return normalized == FILE_INGEST_PLACEHOLDER_URL.rstrip("/") or normalized.startswith(
        "https://import.shorup.local/"
    )


def rss_pull_enabled_for_source(feed_url: str, ingest_mode: str) -> bool:
    if ingest_mode != INGEST_MODE_RSS:
        return False
    if is_placeholder_feed_url(feed_url):
        return False
    return True


if TYPE_CHECKING:
    from app.models.source import Source


def source_uses_rss_pull(source: Source) -> bool:
    mode = getattr(source, "ingest_mode", INGEST_MODE_RSS) or INGEST_MODE_RSS
    return rss_pull_enabled_for_source(source.feed_url, mode)
