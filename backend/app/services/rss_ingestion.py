"""Fetch Bangladesh RSS feeds, persist articles, and assign simple title-based clusters."""

from __future__ import annotations

import logging
import re
import unicodedata
from urllib.parse import urlparse
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.data.bd_sources_seed import BD_SOURCE_SEED
from app.models.article import Article
from app.models.cluster import Cluster
from app.models.source import Source
from app.services.article_availability import refresh_article_availability
from app.services.article_enrichment import (
    apply_topic_to_cluster,
    assess_rumor_coverage,
    infer_story_topic,
    resolve_article_perspective,
    stamp_rumor_fields,
)
from app.services.article_excerpts import note_article_excerpt
from app.services.article_titles import note_article_title
from app.services.cluster_events import log_cluster_merge
from app.services.rss_parser import ParsedFeedItem, fetch_feed_items
from app.services.social_preview import load_frozen_preview, page_notes_correction, text_notes_correction
from app.services.source_ingest_mode import source_uses_rss_pull
from app.services.story_match import cross_lingual_score, normalize_article_title, prefer_bangla_title

logger = logging.getLogger(__name__)

CLUSTER_LOOKBACK_HOURS = 72
CLUSTER_SIMILARITY_THRESHOLD = 0.42

# Extra section feeds that belong to the same outlet (keyed by seed source name).
_SEED_ADDITIONAL_FEEDS: dict[str, list[str]] = {
    row["name"]: list(row.get("additional_feed_urls", [])) for row in BD_SOURCE_SEED
}


def feed_urls_for_source(source: Source) -> list[str]:
    """Primary feed plus stored or seed-defined section feeds for the same outlet."""
    urls = [source.feed_url]
    extras = list(source.additional_feed_urls or []) + _SEED_ADDITIONAL_FEEDS.get(source.name, [])
    for extra in extras:
        if extra and extra not in urls:
            urls.append(extra)
    return urls


@dataclass
class IngestResult:
    sources_processed: int = 0
    articles_fetched: int = 0
    articles_created: int = 0
    articles_skipped_duplicate: int = 0
    titles_revised: int = 0
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


def headline_match_score(a: str, b: str) -> float:
    """Same-language wording overlap, or a shared place/topic across Bangla and English."""
    return max(title_similarity(a, b), cross_lingual_score(a, b))


def _apply_seed_ownership(source: Source, row: dict) -> None:
    source.owner_name = row.get("owner_name")
    source.owner_url = row.get("owner_url")
    source.parent_name = row.get("parent_name")
    source.parent_url = row.get("parent_url")


async def _stamp_ownership_aliases(session: AsyncSession, row: dict) -> None:
    """Copy publisher fields onto duplicate rows for the same outlet."""
    if not row.get("owner_name"):
        return
    aliases = (
        await session.scalars(
            select(Source).where(
                Source.name != row["name"],
                or_(
                    func.lower(Source.name) == row["name"].lower(),
                    Source.feed_url == row["feed_url"],
                    func.lower(Source.name).like(row["name"].lower() + " %"),
                    func.lower(Source.name).like(row["name"].lower() + "(%"),
                ),
            )
        )
    ).all()
    for alias in aliases:
        _apply_seed_ownership(alias, row)


def _homepage_from_row(row: dict) -> str | None:
    raw = row.get("homepage_url")
    if isinstance(raw, str) and raw.strip():
        return raw.strip()[:2048]
    parsed = urlparse(row.get("feed_url", ""))
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}/"
    return row.get("owner_url")


def _apply_seed_fields(source: Source, row: dict) -> None:
    _apply_seed_ownership(source, row)
    extras = row.get("additional_feed_urls") or []
    if isinstance(extras, list) and extras:
        merged = list(source.additional_feed_urls or [])
        for url in extras:
            if url and url not in merged:
                merged.append(url)
        source.additional_feed_urls = merged
    homepage = _homepage_from_row(row)
    if homepage and not source.homepage_url:
        source.homepage_url = homepage
    if row.get("language") and not source.language:
        source.language = str(row["language"])[:8]
    if row.get("factuality") and not source.factuality:
        source.factuality = str(row["factuality"])[:32]


async def ensure_sources_seeded(session: AsyncSession) -> None:
    for row in BD_SOURCE_SEED:
        existing = await session.scalar(select(Source).where(Source.name == row["name"]))
        if existing is None:
            session.add(
                Source(
                    name=row["name"],
                    feed_url=row["feed_url"],
                    bias_score=row.get("bias_score"),
                    ingest_mode=row.get("ingest_mode", "rss"),
                    owner_name=row.get("owner_name"),
                    owner_url=row.get("owner_url"),
                    parent_name=row.get("parent_name"),
                    parent_url=row.get("parent_url"),
                    homepage_url=_homepage_from_row(row),
                    additional_feed_urls=list(row.get("additional_feed_urls") or []),
                    language=str(row.get("language") or "bn")[:8],
                    factuality=row.get("factuality"),
                )
            )
        else:
            if not existing.disabled:
                existing.feed_url = row["feed_url"]
                existing.bias_score = row.get("bias_score")
            _apply_seed_fields(existing, row)
        await _stamp_ownership_aliases(session, row)


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
        .execution_options(populate_existing=True)
    )
    best: Cluster | None = None
    best_score = CLUSTER_SIMILARITY_THRESHOLD
    for cluster in result.scalars():
        for article in cluster.articles:
            score = headline_match_score(title, article.title)
            if score > best_score:
                best_score = score
                best = cluster
    return best


def _clusters_share_story(left: Cluster, right: Cluster) -> bool:
    for left_article in left.articles:
        for right_article in right.articles:
            if headline_match_score(left_article.title, right_article.title) > CLUSTER_SIMILARITY_THRESHOLD:
                return True
    return False


async def merge_cross_language_clusters(session: AsyncSession, since: datetime) -> None:
    """Join recent clusters that title wording split by language. Keep the older slug."""
    rows = (
        await session.execute(
            select(Cluster)
            .options(selectinload(Cluster.articles))
            .where(Cluster.created_at >= since)
            .order_by(Cluster.created_at.asc())
            .execution_options(populate_existing=True)
        )
    ).scalars().unique().all()
    clusters = list(rows)
    if not clusters:
        return

    parent = {cluster.id: cluster.id for cluster in clusters}

    def find(cluster_id: int) -> int:
        while parent[cluster_id] != cluster_id:
            parent[cluster_id] = parent[parent[cluster_id]]
            cluster_id = parent[cluster_id]
        return cluster_id

    def union(left_id: int, right_id: int) -> None:
        left_root = find(left_id)
        right_root = find(right_id)
        if left_root != right_root:
            parent[right_root] = left_root

    for index, left in enumerate(clusters):
        if not left.articles:
            continue
        for right in clusters[index + 1 :]:
            if not right.articles or find(left.id) == find(right.id):
                continue
            if _clusters_share_story(left, right):
                union(left.id, right.id)

    grouped: dict[int, list[Cluster]] = {}
    for cluster in clusters:
        grouped.setdefault(find(cluster.id), []).append(cluster)

    for members in grouped.values():
        keeper = min(members, key=lambda cluster: (cluster.created_at, cluster.id))
        title = keeper.title
        for member in members:
            for article in member.articles:
                title = prefer_bangla_title(title, article.title)
        for other in members:
            if other.id == keeper.id:
                continue
            for article in list(other.articles):
                article.cluster = keeper
            await log_cluster_merge(
                session,
                keeper_cluster_id=keeper.id,
                other_cluster_id=other.id,
                payload={"keeper_slug": keeper.slug, "other_slug": other.slug},
            )
            await session.flush()
            await session.delete(other)
        if title != keeper.title:
            keeper.title = title

    await session.flush()


async def _freeze_social_preview(article: Article, *, rss_image_url: str | None) -> None:
    """Snapshot the share card once. A later edit must not replace it."""
    if article.social_preview_captured_at is not None:
        return
    frozen = await load_frozen_preview(
        article.url,
        headline=article.title,
        excerpt=article.excerpt,
        rss_image_url=rss_image_url,
    )
    article.social_preview_title = frozen.title
    article.social_preview_description = frozen.description
    article.social_preview_image_url = frozen.image_url
    article.social_preview_captured_at = datetime.now(timezone.utc)


async def _note_correction(
    article: Article,
    title: str,
    excerpt: str | None,
    *,
    fetch_page: bool,
) -> None:
    if article.correction_noted:
        return
    if text_notes_correction(title) or text_notes_correction(excerpt):
        article.correction_noted = True
        return
    if fetch_page and await page_notes_correction(article.url):
        article.correction_noted = True


async def maybe_refresh_cluster_summary(session: AsyncSession, cluster: Cluster) -> bool:
    """Cluster blurbs are built from RSS excerpts on the frontend — no AI summary."""
    return False


def _touch_cluster(cluster: Cluster, *, at: datetime) -> None:
    cluster.updated_at = at
    if cluster.last_article_at is None or at > cluster.last_article_at:
        cluster.last_article_at = at


def _apply_item_fields(
    article: Article,
    item: ParsedFeedItem,
    source: Source,
    *,
    ingest_feed_url: str | None,
    now: datetime,
) -> None:
    if item.rss_guid and not article.rss_guid:
        article.rss_guid = item.rss_guid
    if item.author and not article.author:
        article.author = item.author
    if item.section and not article.section:
        article.section = item.section
    if item.body_text and not article.body_text:
        article.body_text = item.body_text
    if item.image_url and not article.image_url:
        article.image_url = item.image_url
    if ingest_feed_url:
        article.ingest_feed_url = ingest_feed_url
    article.perspective = resolve_article_perspective(source)
    stamp_rumor_fields(article, assess_rumor_coverage(article.title, article.excerpt))
    article.last_ingested_at = now
    article.updated_at = now
    if article.first_seen_at is None:
        article.first_seen_at = item.published_at or now
    if article.availability_status == "unknown":
        article.availability_status = "ok"


async def persist_feed_items(
    session: AsyncSession,
    source: Source,
    items: list[ParsedFeedItem],
    result: IngestResult,
    *,
    ingest_feed_url: str | None = None,
) -> None:
    since = datetime.now(timezone.utc) - timedelta(hours=CLUSTER_LOOKBACK_HOURS)

    for index, item in enumerate(items):
        clean_title = normalize_article_title(item.title)
        if not clean_title:
            continue
        now = datetime.now(timezone.utc)
        topic_guess = infer_story_topic(
            title=clean_title,
            section=item.section,
            tags=item.tags,
            feed_url=ingest_feed_url,
        )

        existing = await session.scalar(select(Article).where(Article.url == item.url))
        if existing is not None:
            if item.excerpt and item.excerpt != existing.excerpt:
                await note_article_excerpt(session, existing, existing.excerpt)
                existing.excerpt = item.excerpt
                await note_article_excerpt(session, existing, item.excerpt)
            elif item.excerpt:
                await note_article_excerpt(session, existing, item.excerpt)
            revised = await note_article_title(session, existing, clean_title)
            if revised:
                result.titles_revised += 1
            else:
                result.articles_skipped_duplicate += 1
            _apply_item_fields(existing, item, source, ingest_feed_url=ingest_feed_url, now=now)
            await _note_correction(existing, clean_title, item.excerpt, fetch_page=revised)
            if existing.cluster is not None:
                _touch_cluster(existing.cluster, at=now)
                apply_topic_to_cluster(existing.cluster, topic_guess)
            if revised or index % 25 == 0:
                await refresh_article_availability(existing)
            continue

        cluster = await find_matching_cluster(session, clean_title, since=since)
        if cluster is None:
            slug = await unique_cluster_slug(session, clean_title)
            cluster = Cluster(
                slug=slug,
                title=clean_title,
                topic_id=topic_guess.topic_id,
                category=topic_guess.category,
                category_bn=topic_guess.category_bn,
                created_at=now,
                updated_at=now,
                last_article_at=now,
            )
            session.add(cluster)
            await session.flush()
            result.clusters_created += 1
        else:
            result.clusters_updated += 1
            bangla_title = prefer_bangla_title(cluster.title, clean_title)
            if bangla_title != cluster.title:
                cluster.title = bangla_title
            apply_topic_to_cluster(cluster, topic_guess)
            _touch_cluster(cluster, at=now)

        article = Article(
            source_id=source.id,
            cluster=cluster,
            title=clean_title,
            url=item.url,
            excerpt=item.excerpt,
            image_url=item.image_url,
            published_at=item.published_at,
            first_seen_at=item.published_at or now,
            availability_status="ok",
        )
        session.add(article)
        await session.flush()
        _apply_item_fields(article, item, source, ingest_feed_url=ingest_feed_url, now=now)
        if item.excerpt:
            await note_article_excerpt(session, article, item.excerpt)
        await note_article_title(session, article, clean_title)
        await _freeze_social_preview(article, rss_image_url=item.image_url)
        await _note_correction(article, clean_title, item.excerpt, fetch_page=False)
        result.articles_created += 1
        await session.flush()

        if await maybe_refresh_cluster_summary(session, cluster):
            result.clusters_updated += 1

    await merge_cross_language_clusters(session, since)


async def ingest_source(session: AsyncSession, source: Source, result: IngestResult) -> None:
    if not source_uses_rss_pull(source):
        return

    result.sources_processed += 1
    for feed_url in feed_urls_for_source(source):
        try:
            items = await fetch_feed_items(feed_url)
        except Exception as exc:  # noqa: BLE001 — collect per-feed errors and continue
            message = f"{source.name} ({feed_url}): {exc}"
            logger.warning("RSS fetch failed: %s", message)
            result.errors.append(message)
            continue

        result.articles_fetched += len(items)
        await persist_feed_items(session, source, items, result, ingest_feed_url=feed_url)


async def run_rss_ingest_for_source(session: AsyncSession, source_id: int) -> IngestResult:
    result = IngestResult()
    source = await session.get(Source, source_id)
    if source is None:
        raise LookupError("Source not found.")
    if source.disabled:
        raise ValueError("Source is disabled and will not be ingested.")
    if not source_uses_rss_pull(source):
        raise ValueError(
            "This source is in file-import mode. Upload a feed file or save a live RSS URL to switch.",
        )
    await ingest_source(session, source, result)
    await session.commit()
    return result


async def run_rss_ingest(session: AsyncSession) -> IngestResult:
    result = IngestResult()
    await ensure_sources_seeded(session)
    await session.flush()

    sources = (
        await session.execute(select(Source).where(Source.disabled.is_(False)).order_by(Source.name))
    ).scalars().all()
    for source in sources:
        await ingest_source(session, source, result)

    await session.commit()
    return result
