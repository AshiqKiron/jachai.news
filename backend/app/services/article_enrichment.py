"""Perspective, rumor, and topic signals at ingest time."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from re import Pattern

from app.models.source import Source

PERSPECTIVE_VALUES = frozenset({"neutral", "establishment", "opposition", "international"})

INTERNATIONAL_SOURCE_NAMES = frozenset(
    {
        "BBC Bangla",
        "DW Bangla",
        "Al Jazeera Bangla",
        "Voice of America Bangla",
        "Sangbad Pratidin",
    }
)

RUMOR_RE: Pattern[str] = re.compile(
    r"\b(rumour|rumou?rs?|unverified|unconfirmed|allegedly|hearsay)\b"
    r"|সূত্র\s*বলছে|সূত্র\s*আর\s*জানিয়েছে|গুজব|গুঞ্জন|যাচাই\s*হয়নি|যাচাই\s*হয়নি|অনিশ্চিত|কথিত",
    re.IGNORECASE,
)

TOPIC_KEYWORDS: dict[str, tuple[str, str, str]] = {
    "economy": ("Economy", "অর্থনীতি", r"business|econom|finance|trade|market|অর্থনীতি|বাণিজ্য|শেয়ার|বাজার"),
    "politics": ("Politics", "রাজনীতি", r"politic|election|parliament|vote|রাজনীতি|নির্বাচন|সংসদ|মন্ত্রী"),
    "environment": ("Environment", "পরিবেশ", r"climate|environment|flood|cyclone|পরিবেশ|জলবায়ু|বন্যা"),
    "sports": ("Sports", "খেলা", r"sport|cricket|football|match|cup|খেলা|ক্রিকেট|ফুটবল"),
}

MAX_BODY_CHARS = 50_000


@dataclass(frozen=True)
class TopicGuess:
    topic_id: str
    category: str
    category_bn: str


@dataclass(frozen=True)
class RumorAssessment:
    is_rumor: bool
    reason: str | None


def strip_html_to_text(html: str | None) -> str | None:
    if not html:
        return None
    text = unescape(re.sub(r"<[^>]+>", " ", html))
    cleaned = " ".join(text.split())
    if not cleaned:
        return None
    return cleaned[:MAX_BODY_CHARS]


def bias_score_to_perspective(bias_score: float | None) -> str:
    if bias_score is None:
        return "neutral"
    if bias_score <= -0.2:
        return "opposition"
    if bias_score >= 0.2:
        return "establishment"
    return "neutral"


def resolve_article_perspective(source: Source) -> str:
    if source.name in INTERNATIONAL_SOURCE_NAMES:
        return "international"
    return bias_score_to_perspective(source.bias_score)


def assess_rumor_coverage(title: str, excerpt: str | None) -> RumorAssessment:
    combined = f"{title}\n{excerpt or ''}"
    if RUMOR_RE.search(combined):
        return RumorAssessment(is_rumor=True, reason="keyword")
    return RumorAssessment(is_rumor=False, reason=None)


def infer_story_topic(
    *,
    title: str,
    section: str | None,
    tags: tuple[str, ...],
    feed_url: str | None,
) -> TopicGuess:
    haystack = " ".join(
        [
            title,
            section or "",
            " ".join(tags),
            feed_url or "",
        ]
    ).lower()
    for topic_id, (category, category_bn, pattern) in TOPIC_KEYWORDS.items():
        if re.search(pattern, haystack, re.IGNORECASE):
            return TopicGuess(topic_id=topic_id, category=category, category_bn=category_bn)
    return TopicGuess(topic_id="news", category="News", category_bn="সংবাদ")


def apply_topic_to_cluster(cluster, guess: TopicGuess) -> None:
    if not cluster.category:
        cluster.topic_id = guess.topic_id
        cluster.category = guess.category
        cluster.category_bn = guess.category_bn
        return
    priority = {"news": 0, "sports": 1, "environment": 2, "economy": 3, "politics": 4}
    if priority.get(guess.topic_id, 0) > priority.get(cluster.topic_id or "news", 0):
        cluster.topic_id = guess.topic_id
        cluster.category = guess.category
        cluster.category_bn = guess.category_bn


def stamp_rumor_fields(article, assessment: RumorAssessment) -> None:
    article.is_rumor = assessment.is_rumor
    article.rumor_flag_reason = assessment.reason
    if assessment.is_rumor and article.rumor_marked_at is None:
        article.rumor_marked_at = datetime.now(timezone.utc)
