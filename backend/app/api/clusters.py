from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.article import Article
from app.models.cluster import Cluster
from app.schemas.cluster import ClusterArticleRead, ClusterDetail, ClusterListResponse
from app.services.article_titles import snapshot_headline

router = APIRouter()

_CLUSTER_LOAD = (
    selectinload(Cluster.articles).selectinload(Article.source),
    selectinload(Cluster.articles).selectinload(Article.titles),
)


def cluster_to_detail(cluster: Cluster) -> ClusterDetail:
    articles = []
    for article in cluster.articles:
        snap = snapshot_headline(
            article.title,
            [(row.title, row.created_at) for row in article.titles],
        )
        articles.append(
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
                owner_name=article.source.owner_name,
                owner_url=article.source.owner_url,
                parent_name=article.source.parent_name,
                parent_url=article.source.parent_url,
                original_title=snap.original_title,
                original_seen_at=snap.original_seen_at,
                headline_edited_at=snap.headline_edited_at,
                correction_noted=bool(article.correction_noted),
                social_preview_title=article.social_preview_title,
                social_preview_description=article.social_preview_description,
                social_preview_image_url=article.social_preview_image_url,
            )
        )
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
        .options(*_CLUSTER_LOAD)
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
        .options(*_CLUSTER_LOAD)
        .where(Cluster.slug == slug)
    )
    cluster = result.scalar_one_or_none()
    if cluster is None:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return cluster_to_detail(cluster)
