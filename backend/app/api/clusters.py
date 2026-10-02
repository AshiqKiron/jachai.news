from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.cluster import Cluster
from app.schemas.cluster import ClusterDetail, ClusterListResponse, ClusterRead

router = APIRouter()


@router.get("", response_model=ClusterListResponse)
async def list_clusters(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> ClusterListResponse:
    total = await db.scalar(select(func.count()).select_from(Cluster))
    result = await db.execute(select(Cluster).order_by(Cluster.created_at.desc()).offset(offset).limit(limit))
    items = [ClusterRead.model_validate(row) for row in result.scalars().all()]
    return ClusterListResponse(items=items, total=total or 0)


@router.get("/{slug}", response_model=ClusterDetail)
async def get_cluster(slug: str, db: AsyncSession = Depends(get_db)) -> ClusterDetail:
    result = await db.execute(
        select(Cluster).options(selectinload(Cluster.articles)).where(Cluster.slug == slug)
    )
    cluster = result.scalar_one_or_none()
    if cluster is None:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return ClusterDetail.model_validate(cluster)
