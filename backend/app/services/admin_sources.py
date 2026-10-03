from urllib.parse import urlparse

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.bd_sources_seed import BD_SOURCE_SEED
from app.models.article import Article
from app.models.source import Source
from app.schemas.admin import AdminSourceCreate, AdminSourceStat

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
    )


async def create_admin_source(session: AsyncSession, payload: AdminSourceCreate) -> AdminSourceStat:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Name is required.")
    feed_url = _validate_feed_url(payload.feed_url)

    existing = await session.scalar(select(Source).where(Source.name == name))
    if existing is not None:
        if existing.disabled:
            existing.feed_url = feed_url
            existing.bias_score = payload.bias_score
            existing.disabled = False
            await session.commit()
            await session.refresh(existing)
            return await _source_stat(session, existing)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A source with this name already exists.",
        )

    source = Source(name=name, feed_url=feed_url, bias_score=payload.bias_score)
    session.add(source)
    await session.commit()
    await session.refresh(source)
    return await _source_stat(session, source)


async def remove_admin_source(session: AsyncSession, source_id: int) -> AdminSourceStat:
    source = await session.get(Source, source_id)
    if source is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found.")

    article_count = (
        await session.scalar(
            select(func.count()).select_from(Article).where(Article.source_id == source.id)
        )
        or 0
    )

    if source.name in _SEED_NAMES or article_count > 0:
        source.disabled = True
        await session.commit()
        await session.refresh(source)
        return await _source_stat(session, source)

    await session.execute(delete(Source).where(Source.id == source.id))
    await session.commit()
    return AdminSourceStat(
        source_id=source.id,
        name=source.name,
        feed_url=source.feed_url,
        bias_score=source.bias_score,
        article_count=0,
        disabled=True,
    )
