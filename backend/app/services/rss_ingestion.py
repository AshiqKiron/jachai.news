"""Fetch Bangladesh RSS feeds, persist articles, and assign simple title-based clusters."""

from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.data.bd_sources_seed import BD_SOURCE_SEED
from app.models.article import Article
from app.models.cluster import Cluster
from app.models.source import Source
from app.services.ai_client import ai_client
from app.services.rss_parser import fetch_feed_items

logger = logging.getLogger(__name__)

CLUSTER_LOOKBACK_HOURS = 72
CLUSTER_SIMILARITY_THRESHOLD = 0.42


@dataclass
class IngestResult:
    sources_processed: int = 0
    articles_fetched: int = 0
    articles_created: int = 0
    articles_skipped_duplicate: int = 0
    clusters_created: int = 0
    clusters_updated: int = 0
    errors: list[str] = field(default_factory=list)


def slugify(title: str, max_length: int = 80) -> str:
    normalized = unicodedata.normalize("NFKC", title).lower()
    cleaned = re.sub(r"[^\w\s-]", " ", normalized, flags=re.UNICODE)
    slug = re.sub(r"[\s_-]+", "-", cleaned).strip("-")
    if not slug:
        slug = "story"
    return slug[:max_length].rstrip("-") or "story"


def title_token_set(title: str) -> set[str]:
    normalized = unicodedata.normalize("NFKC", title).lower()
    cleaned = re.sub(r"[^\w\s]", " ", normalized, flags=re.UNICODE)
    return {token for token in cleaned.split() if len(token) > 1}


def title_similarity(a: str, b: str) -> float:
    tokens_a = title_token_set(a)
    tokens_b = title_token_set(b)
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = len(tokens_a & tokens_b)
    union = len(tokens_a | tokens_b)
    return intersection / union if union else 0.0


async def ensure_sources_seeded(session: AsyncSession) -> None:
    for row in BD_SOURCE_SEED:
        existing = await session.scalar(select(Source).where(Source.name == row["name"]))
        if existing is None:
            session.add(
                Source(
                    name=row["name"],
                    feed_url=row["feed_url"],
                    bias_score=row.get("bias_score"),
                )
            )
        else:
            existing.feed_url = row["feed_url"]
            existing.bias_score = row.get("bias_score")


async def unique_cluster_slug(session: AsyncSession, base_title: str) -> str:
    base = slugify(base_title)
    candidate = base
    suffix = 2
    while await session.scalar(select(Cluster.id).where(Cluster.slug == candidate)):
        candidate = f"{base}-{suffix}"
        suffix += 1
    return candidate


async def find_matching_cluster(
    session: AsyncSession,
    title: str,
    *,
    since: datetime,
) -> Cluster | None:
    result = await session.execute(
        select(Cluster)
        .options(selectinload(Cluster.articles))
        .where(Cluster.created_at >= since)
        .order_by(Cluster.created_at.desc())
        .limit(200)
    )
    best: Cluster | None = None
    best_score = CLUSTER_SIMILARITY_THRESHOLD
    for cluster in result.scalars():
        for article in cluster.articles:
            score = title_similarity(title, article.title)
            if score > best_score:
                best_score = score
                best = cluster
    return best


async def maybe_refresh_cluster_summary(session: AsyncSession, cluster: Cluster) -> bool:
    await session.refresh(cluster, attribute_names=["articles"])
    if len(cluster.articles) < 2:
        return False
    headlines = [article.title for article in cluster.articles[:12]]
    summary = await ai_client.summarize_cluster(headlines)
    if summary and summary != cluster.summary:
        cluster.summary = summary
        return True
    return False


async def ingest_source(session: AsyncSession, source: Source, result: IngestResult) -> None:
    result.sources_processed += 1
    try:
        items = await fetch_feed_items(source.feed_url)
    except Exception as exc:  # noqa: BLE001 — collect per-source errors and continue
        message = f"{source.name}: {exc}"
        logger.warning("RSS fetch failed: %s", message)
        result.errors.append(message)
        return

    result.articles_fetched += len(items)
    since = datetime.now(timezone.utc) - timedelta(hours=CLUSTER_LOOKBACK_HOURS)

    for item in items:
        existing = await session.scalar(select(Article.id).where(Article.url == item.url))
        if existing is not None:
            result.articles_skipped_duplicate += 1
            continue

        cluster = await find_matching_cluster(session, item.title, since=since)
        if cluster is None:
            slug = await unique_cluster_slug(session, item.title)
            cluster = Cluster(slug=slug, title=item.title.strip())
            session.add(cluster)
            await session.flush()
            result.clusters_created += 1
        else:
            result.clusters_updated += 1

        session.add(
            Article(
                source_id=source.id,
                cluster_id=cluster.id,
                title=item.title,
                url=item.url,
                excerpt=item.excerpt,
                published_at=item.published_at,
            )
        )
        result.articles_created += 1
        await session.flush()

        if await maybe_refresh_cluster_summary(session, cluster):
            result.clusters_updated += 1


async def run_rss_ingest(session: AsyncSession) -> IngestResult:
    result = IngestResult()
    await ensure_sources_seeded(session)
    await session.flush()

    sources = (await session.execute(select(Source).order_by(Source.name))).scalars().all()
    for source in sources:
        await ingest_source(session, source, result)

    await session.commit()
    return result
