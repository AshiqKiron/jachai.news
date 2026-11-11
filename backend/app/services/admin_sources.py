from urllib.parse import urlparse

from fastapi import HTTPException, status
from sqlalchemy import delete, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.bd_sources_seed import BD_SOURCE_SEED
from app.models.article import Article
from app.models.cluster import Cluster
from app.models.source import Source
from app.schemas.admin import AdminSourceCreate, AdminSourceStat, AdminSourceUpdate
from app.services.source_ingest_mode import (
    FILE_INGEST_PLACEHOLDER_URL,
    INGEST_MODE_FILE,
    INGEST_MODE_RSS,
    is_placeholder_feed_url,
)

_SEED_NAMES = {row["name"] for row in BD_SOURCE_SEED}


def _validate_feed_url(feed_url: str) -> str:
    parsed = urlparse(feed_url.strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Feed URL must be a valid http or https URL.",
        )
    return feed_url.strip()


async def _source_stat(session: AsyncSession, source: Source) -> AdminSourceStat:
    article_count = (
        await session.scalar(
            select(func.count()).select_from(Article).where(Article.source_id == source.id)
        )
        or 0
    )
    return AdminSourceStat(
        source_id=source.id,
        name=source.name,
        feed_url=source.feed_url,
        bias_score=source.bias_score,
        article_count=article_count,
        disabled=source.disabled,
        ingest_mode=source.ingest_mode if source.ingest_mode in (INGEST_MODE_RSS, INGEST_MODE_FILE) else INGEST_MODE_RSS,
    )


def _resolve_create_feed_url(payload: AdminSourceCreate) -> tuple[str, str]:
    mode = payload.ingest_mode
    if mode == INGEST_MODE_FILE:
        if payload.feed_url and payload.feed_url.strip():
            return _validate_feed_url(payload.feed_url), INGEST_MODE_FILE
        return FILE_INGEST_PLACEHOLDER_URL, INGEST_MODE_FILE
    if not payload.feed_url or not payload.feed_url.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Feed URL is required for live RSS sources.",
        )
    return _validate_feed_url(payload.feed_url), INGEST_MODE_RSS


async def create_admin_source(session: AsyncSession, payload: AdminSourceCreate) -> AdminSourceStat:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Name is required.")
    feed_url, ingest_mode = _resolve_create_feed_url(payload)

    existing = await session.scalar(select(Source).where(Source.name == name))
    if existing is not None:
        if existing.disabled:
            existing.feed_url = feed_url
            existing.bias_score = payload.bias_score
            existing.ingest_mode = ingest_mode
            existing.disabled = False
            await session.commit()
            await session.refresh(existing)
            return await _source_stat(session, existing)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A source with this name already exists.",
        )

    source = Source(
        name=name,
        feed_url=feed_url,
        bias_score=payload.bias_score,
        ingest_mode=ingest_mode,
    )
    session.add(source)
    await session.commit()
    await session.refresh(source)
    return await _source_stat(session, source)


async def _purge_source_articles(session: AsyncSession, source_id: int) -> None:
    await session.execute(delete(Article).where(Article.source_id == source_id))
    await session.execute(
        delete(Cluster).where(~exists(select(1).where(Article.cluster_id == Cluster.id)))
    )


async def update_admin_source(
    session: AsyncSession, source_id: int, payload: AdminSourceUpdate
) -> AdminSourceStat:
    source = await session.get(Source, source_id)
    if source is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found.")
    if source.disabled:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This feed is disabled. Re-add it with the same outlet name to turn it back on.",
        )

    if payload.feed_url is None and payload.ingest_mode is None and payload.bias_score is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No changes provided.",
        )

    if payload.feed_url is not None and payload.feed_url.strip():
        validated = _validate_feed_url(payload.feed_url)
        source.feed_url = validated
        if not is_placeholder_feed_url(validated):
            source.ingest_mode = INGEST_MODE_RSS
    if payload.ingest_mode is not None:
        source.ingest_mode = payload.ingest_mode
        if payload.ingest_mode == INGEST_MODE_FILE and is_placeholder_feed_url(source.feed_url):
            pass
        elif payload.ingest_mode == INGEST_MODE_RSS and is_placeholder_feed_url(source.feed_url):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Save a live RSS URL before switching this source to RSS mode.",
            )
    if payload.bias_score is not None:
        source.bias_score = payload.bias_score
    await session.commit()
    await session.refresh(source)
    return await _source_stat(session, source)


async def remove_admin_source(session: AsyncSession, source_id: int) -> AdminSourceStat:
    source = await session.get(Source, source_id)
    if source is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found.")

    snapshot = AdminSourceStat(
        source_id=source.id,
        name=source.name,
        feed_url=source.feed_url,
        bias_score=source.bias_score,
        article_count=0,
        disabled=True,
    )

    await _purge_source_articles(session, source.id)

    if source.name in _SEED_NAMES:
        source.disabled = True
        await session.commit()
        await session.refresh(source)
        return await _source_stat(session, source)

    await session.execute(delete(Source).where(Source.id == source.id))
    await session.commit()
    return snapshot
