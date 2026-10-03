from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.data.bd_sources_seed import BD_SOURCE_SEED
from app.models.source import Source
from app.schemas.source import SourceListResponse, SourceRead

router = APIRouter()

_SEED_NAMES = {row["name"] for row in BD_SOURCE_SEED}


@router.get("", response_model=SourceListResponse)
async def list_sources(
    db: AsyncSession = Depends(get_db),
    custom_only: bool = Query(False, description="When true, only admin-added feeds (not built-in seed outlets)."),
) -> SourceListResponse:
    query = select(Source).where(Source.disabled.is_(False)).order_by(Source.name)
    if custom_only:
        query = query.where(Source.name.not_in(list(_SEED_NAMES)))
    result = await db.execute(query)
    items = [SourceRead(source_id=row.id, name=row.name) for row in result.scalars().all()]
    return SourceListResponse(items=items)
