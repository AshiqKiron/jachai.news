from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.article import Article
from app.models.source import Source
from app.schemas.article import ArticleListResponse, ArticleRead

router = APIRouter()


def _article_filters(source_id: int | None) -> list:
    filters = [Source.disabled.is_(False)]
    if source_id is not None:
        filters.append(Article.source_id == source_id)
    return filters


@router.get("", response_model=ArticleListResponse)
async def list_articles(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    source_id: int | None = Query(None, ge=1),
) -> ArticleListResponse:
    if source_id is not None:
        exists = await db.scalar(select(Source.id).where(Source.id == source_id, Source.disabled.is_(False)))
        if exists is None:
            raise HTTPException(status_code=404, detail="Source not found.")

    filters = _article_filters(source_id)
    total = await db.scalar(
        select(func.count())
        .select_from(Article)
        .join(Source, Article.source_id == Source.id)
        .where(*filters)
    )
    result = await db.execute(
        select(Article)
        .join(Source, Article.source_id == Source.id)
        .where(*filters)
        .order_by(Article.published_at.desc().nullslast())
        .offset(offset)
        .limit(limit)
    )
    items = [ArticleRead.model_validate(row) for row in result.scalars().all()]
    return ArticleListResponse(items=items, total=total or 0)
