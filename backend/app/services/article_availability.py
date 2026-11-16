"""Lightweight HTTP checks so taken-down articles stay on the card with timestamps."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from app.core.config import settings
from app.models.article import Article
from app.services.object_storage import ObjectStorageError, object_storage_enabled, upload_bytes
from app.services.rss_parser import _FEED_REQUEST_HEADERS

logger = logging.getLogger(__name__)

_GONE_STATUSES = frozenset({404, 410, 451})


async def _archive_removed_snapshot(article: Article) -> None:
    if article.archive_snapshot_url or not object_storage_enabled():
        return
    import json

    payload = json.dumps(
        {
            "title": article.removed_headline or article.title,
            "excerpt": article.removed_excerpt or article.excerpt,
            "url": article.url,
        },
        ensure_ascii=False,
    ).encode("utf-8")
    path = f"article-vault/{article.id}.json"
    try:
        article.archive_snapshot_url = await upload_bytes(path, payload, "application/json")
    except ObjectStorageError as exc:
        logger.debug("archive snapshot skipped for %s: %s", article.url, exc)


async def refresh_article_availability(article: Article) -> None:
    """HEAD the live URL. Record removal snapshots once."""
    now = datetime.now(timezone.utc)
    article.last_availability_check = now
    try:
        async with httpx.AsyncClient(
            timeout=settings.rss_fetch_timeout_seconds,
            follow_redirects=True,
            headers=_FEED_REQUEST_HEADERS,
        ) as client:
            response = await client.head(article.url)
    except httpx.HTTPError as exc:
        logger.debug("availability check failed for %s: %s", article.url, exc)
        return

    if response.status_code in _GONE_STATUSES:
        article.availability_status = "gone"
        if article.removed_at is None:
            article.removed_at = now
            article.removed_headline = article.title
            article.removed_excerpt = article.excerpt
            await _archive_removed_snapshot(article)
        return

    if response.status_code < 400:
        article.availability_status = "ok"
        return

    article.availability_status = "unknown"
