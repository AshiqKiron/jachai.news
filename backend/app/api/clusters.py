from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.article import Article
from app.models.cluster import Cluster
from app.schemas.cluster import ClusterArticleRead, ClusterDetail, ClusterListResponse

router = APIRouter()


def cluster_to_detail(cluster: Cluster) -> ClusterDetail:
    articles = [
        ClusterArticleRead(
            id=article.id,
            source_id=article.source_id,
            cluster_id=article.cluster_id,
            title=article.title,
            url=article.url,
            excerpt=article.excerpt,
            image_url=article.image_url,
            published_at=article.published_at,
            is_rumor=article.is_rumor,
            source_name=article.source.name,
            bias_score=article.source.bias_score,
        )
        for article in cluster.articles
    ]
    return ClusterDetail(
        id=cluster.id,
        slug=cluster.slug,
        title=cluster.title,
        summary=cluster.summary,
        created_at=cluster.created_at,
        articles=articles,
    )


@router.get("", response_model=ClusterListResponse)
async def list_clusters(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> ClusterListResponse:
    total = await db.scalar(select(func.count()).select_from(Cluster))
    result = await db.execute(
        select(Cluster)
        .options(selectinload(Cluster.articles).selectinload(Article.source))
        .order_by(Cluster.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = [cluster_to_detail(row) for row in result.scalars().all()]
    return ClusterListResponse(items=items, total=total or 0)


@router.get("/{slug}", response_model=ClusterDetail)
async def get_cluster(slug: str, db: AsyncSession = Depends(get_db)) -> ClusterDetail:
    result = await db.execute(
        select(Cluster)
        .options(selectinload(Cluster.articles).selectinload(Article.source))
        .where(Cluster.slug == slug)
    )
    cluster = result.scalar_one_or_none()
    if cluster is None:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return cluster_to_detail(cluster)
