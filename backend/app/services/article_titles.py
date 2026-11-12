"""Persist every distinct article headline so later features can read them."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article import Article
from app.models.article_title import ArticleTitle
from app.services.story_match import normalize_article_title, title_language


@dataclass(frozen=True)
class TitleStorePlan:
    """What to write for one incoming headline."""

    article_title: str
    insert_titles: tuple[str, ...]
    revised: bool


@dataclass(frozen=True)
class HeadlineSnapshot:
    """The first wording, and when a later poll replaced it."""

    original_title: str
    original_seen_at: datetime | None
    headline_edited_at: datetime | None


def _seen_sort_key(seen_at: datetime | None) -> tuple[int, float]:
    if seen_at is None:
        return (1, 0.0)
    if seen_at.tzinfo is None:
        seen_at = seen_at.replace(tzinfo=timezone.utc)
    return (0, seen_at.timestamp())


def snapshot_headline(
    current_title: str,
    history: list[tuple[str, datetime | None]],
) -> HeadlineSnapshot:
    """The earliest stored wording stays the first headline.

    `headline_edited_at` is set only when the live title is a later wording.
    """
    current = normalize_article_title(current_title)
    rows: list[tuple[str, datetime | None]] = []
    for title, seen_at in history:
        text = normalize_article_title(title)
        if text:
            rows.append((text, seen_at))
    rows.sort(key=lambda row: _seen_sort_key(row[1]))
    if not rows:
        return HeadlineSnapshot(original_title=current, original_seen_at=None, headline_edited_at=None)

    original, seen_at = rows[0]
    if original == current:
        return HeadlineSnapshot(original_title=original, original_seen_at=seen_at, headline_edited_at=None)

    edited_at: datetime | None = None
    for text, row_seen in reversed(rows):
        if text == current:
            edited_at = row_seen
            break
    return HeadlineSnapshot(
        original_title=original,
        original_seen_at=seen_at,
        headline_edited_at=edited_at,
    )


def plan_title_store(
    current: str | None,
    known_titles: set[str],
    incoming: str,
) -> TitleStorePlan | None:
    """Decide which wordings to keep. Empty input stores nothing.

    A rewrite inserts the new wording and, if the previous wording was never
    stored, that previous wording too. The article stays on its current title
    until the caller applies `article_title`.
    """
    clean = normalize_article_title(incoming)
    if not clean:
        return None

    current_clean = normalize_article_title(current or "")
    known = {normalize_article_title(title) for title in known_titles}
    known.discard("")

    inserts: list[str] = []
    if current_clean and current_clean != clean and current_clean not in known:
        inserts.append(current_clean)
    if clean not in known:
        inserts.append(clean)

    return TitleStorePlan(
        article_title=clean,
        insert_titles=tuple(inserts),
        revised=bool(current_clean) and current_clean != clean,
    )


async def note_article_title(session: AsyncSession, article: Article, incoming: str) -> bool:
    """Store a distinct headline on `article`. Returns True when the wording changed.

    Requires `article.id` (flush the new article first). Does not move the article
    to another cluster — a rewritten headline stays with the story it joined.
    """
    if article.id is None:
        raise ValueError("Article must be flushed before its title is stored.")

    known = set(
        (
            await session.scalars(select(ArticleTitle.title).where(ArticleTitle.article_id == article.id))
        ).all()
    )
    plan = plan_title_store(article.title, known, incoming)
    if plan is None:
        return False

    for title in plan.insert_titles:
        session.add(
            ArticleTitle(
                article_id=article.id,
                title=title,
                language=title_language(title),
            )
        )
    if article.title != plan.article_title:
        article.title = plan.article_title
    return plan.revised
