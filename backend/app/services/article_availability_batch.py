"""Scheduled HEAD checks for recent articles (taken-down vault)."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article import Article
from app.services.article_availability import refresh_article_availability

logger = logging.getLogger(__name__)


async def run_availability_check_batch(
    session: AsyncSession,
    *,
    batch_size: int = 40,
    stale_hours: int = 6,
    lookback_days: int = 14,
) -> dict[str, int]:
    """Re-check live URLs that have not been checked recently."""
    now = datetime.now(timezone.utc)
    stale_before = now - timedelta(hours=stale_hours)
    seen_since = now - timedelta(days=lookback_days)

    filters = (
        Article.removed_at.is_(None),
        Article.first_seen_at >= seen_since,
        or_(
            Article.last_availability_check.is_(None),
            Article.last_availability_check < stale_before,
        ),
    )
    rows = (
        await session.scalars(
            select(Article)
            .where(*filters)
            .order_by(Article.last_ingested_at.desc().nullslast(), Article.id.desc())
            .limit(batch_size)
        )
    ).all()

    checked = 0
    removed = 0
    for article in rows:
        before = article.removed_at
        await refresh_article_availability(article)
        checked += 1
        if before is None and article.removed_at is not None:
            removed += 1

    await session.commit()
    logger.info("availability batch: checked=%s newly_removed=%s", checked, removed)
    return {"checked": checked, "newly_removed": removed}
