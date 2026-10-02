from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.article import Article
from app.schemas.article import ArticleListResponse, ArticleRead

router = APIRouter()


@router.get("", response_model=ArticleListResponse)
async def list_rumors(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> ArticleListResponse:
    filters = Article.is_rumor.is_(True)
    total = await db.scalar(select(func.count()).select_from(Article).where(filters))
    result = await db.execute(
        select(Article).where(filters).order_by(Article.published_at.desc().nullslast()).offset(offset).limit(limit)
    )
    items = [ArticleRead.model_validate(row) for row in result.scalars().all()]
    return ArticleListResponse(items=items, total=total or 0)
