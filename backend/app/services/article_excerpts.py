"""Persist every distinct RSS excerpt for an article."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article import Article
from app.models.article_excerpt import ArticleExcerpt


def _normalize_excerpt(text: str) -> str:
    return " ".join(text.split())[:8000]


async def note_article_excerpt(session: AsyncSession, article: Article, incoming: str | None) -> bool:
    """Append a new excerpt ledger row when the RSS description changes."""
    if not incoming or not incoming.strip():
        return False
    cleaned = _normalize_excerpt(incoming.strip())
    if not cleaned:
        return False
    existing = await session.scalar(
        select(ArticleExcerpt.id).where(
            ArticleExcerpt.article_id == article.id,
            ArticleExcerpt.excerpt == cleaned,
        )
    )
    if existing is not None:
        return False
    session.add(
        ArticleExcerpt(
            article_id=article.id,
            excerpt=cleaned,
            created_at=datetime.now(timezone.utc),
        )
    )
    return True
