from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.article import Article
from app.models.cluster import Cluster
from app.models.source import Source
from app.schemas.admin import AdminClusterPreview, AdminOverviewResponse, AdminSourceStat


async def get_admin_overview(session: AsyncSession) -> AdminOverviewResponse:
    articles_total = await session.scalar(select(func.count()).select_from(Article)) or 0
    clusters_total = await session.scalar(select(func.count()).select_from(Cluster)) or 0
    sources_total = await session.scalar(select(func.count()).select_from(Source)) or 0
    rumors_total = (
        await session.scalar(select(func.count()).select_from(Article).where(Article.is_rumor.is_(True)))
        or 0
    )
    latest_article_at = await session.scalar(select(func.max(Article.published_at)))
    latest_cluster_at = await session.scalar(select(func.max(Cluster.created_at)))

    source_rows = await session.execute(
        select(
            Source.id,
            Source.name,
            Source.feed_url,
            Source.bias_score,
            func.count(Article.id).label("article_count"),
        )
        .outerjoin(Article, Article.source_id == Source.id)
        .group_by(Source.id)
        .order_by(Source.name)
    )
    sources = [
        AdminSourceStat(
            source_id=row.id,
            name=row.name,
            feed_url=row.feed_url,
            bias_score=row.bias_score,
            article_count=row.article_count or 0,
        )
        for row in source_rows
    ]

    cluster_rows = await session.execute(
        select(
            Cluster.id,
            Cluster.slug,
            Cluster.title,
            Cluster.created_at,
            func.count(Article.id).label("article_count"),
        )
        .outerjoin(Article, Article.cluster_id == Cluster.id)
        .group_by(Cluster.id)
        .order_by(Cluster.created_at.desc())
        .limit(12)
    )
    recent_clusters = [
        AdminClusterPreview(
            id=row.id,
            slug=row.slug,
            title=row.title,
            created_at=row.created_at,
            article_count=row.article_count or 0,
        )
        for row in cluster_rows
    ]

    return AdminOverviewResponse(
        articles_total=articles_total,
        clusters_total=clusters_total,
        sources_total=sources_total,
        rumors_total=rumors_total,
        latest_article_at=latest_article_at,
        latest_cluster_at=latest_cluster_at,
        sources=sources,
        recent_clusters=recent_clusters,
        ai_provider=settings.ai_provider,
        ingest_key_configured=bool(settings.ingest_api_key),
        groq_configured=bool(settings.groq_api_key),
        gemini_configured=bool(settings.gemini_api_key),
    )
