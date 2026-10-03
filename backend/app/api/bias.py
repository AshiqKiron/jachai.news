from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.source import Source
from app.schemas.bias import BiasOverviewResponse, SourceBiasRead

router = APIRouter()


@router.get("", response_model=BiasOverviewResponse)
async def bias_overview(db: AsyncSession = Depends(get_db)) -> BiasOverviewResponse:
    result = await db.execute(select(Source).where(Source.disabled.is_(False)).order_by(Source.name))
    sources = [
        SourceBiasRead(source_id=row.id, name=row.name, bias_score=row.bias_score)
        for row in result.scalars().all()
    ]
    return BiasOverviewResponse(sources=sources)
