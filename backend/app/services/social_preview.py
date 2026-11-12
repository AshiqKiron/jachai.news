"""Freeze the share card from the first time a story is seen.

Later polls keep the headline ledger moving. They do not replace this snapshot.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from html import unescape

import httpx

from app.services.rss_parser import _normalize_image_url

logger = logging.getLogger(__name__)

_META_TAG_RE = re.compile(r"<meta\s+[^>]*>", re.IGNORECASE)
_ATTR_RE = re.compile(
    r"""([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')""",
    re.IGNORECASE,
)
_CORRECTION_RE = re.compile(
    r"সংশোধনী|শিরোনাম\s*সংশোধন|খবরটি\s*সংশোধন|ভুলবশত|"
    r"we regret|has been corrected|was corrected|clarification\s*:|correction\s*:",
    re.IGNORECASE,
)
_PAGE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
}


@dataclass(frozen=True)
class SocialPreview:
    title: str | None
    description: str | None
    image_url: str | None


def text_notes_correction(text: str | None) -> bool:
    """True when the copy includes a correction notice, not a softer headline."""
    if not text:
        return False
    return _CORRECTION_RE.search(text) is not None


def _meta_map(tag: str) -> dict[str, str]:
    found: dict[str, str] = {}
    for match in _ATTR_RE.finditer(tag):
        key = match.group(1).lower()
        found[key] = unescape(match.group(2) if match.group(2) is not None else match.group(3) or "")
    return found


def parse_social_preview(html: str) -> SocialPreview:
    """Read og:* first, then twitter:* if Open Graph is missing."""
    title: str | None = None
    description: str | None = None
    image_url: str | None = None
    twitter_title: str | None = None
    twitter_description: str | None = None
    twitter_image: str | None = None

    for tag in _META_TAG_RE.findall(html):
        attrs = _meta_map(tag)
        key = (attrs.get("property") or attrs.get("name") or "").strip().lower()
        content = " ".join((attrs.get("content") or "").split())
        if not key or not content:
            continue
        if key == "og:title":
            title = content[:2000]
        elif key == "og:description":
            description = content[:4000]
        elif key == "og:image":
            image_url = _normalize_image_url(content)
        elif key == "twitter:title":
            twitter_title = content[:2000]
        elif key == "twitter:description":
            twitter_description = content[:4000]
        elif key == "twitter:image":
            twitter_image = _normalize_image_url(content)

    return SocialPreview(
        title=title or twitter_title,
        description=description or twitter_description,
        image_url=image_url or twitter_image,
    )


def freeze_social_preview(
    *,
    headline: str,
    excerpt: str | None,
    rss_image_url: str | None,
    html: str | None,
) -> SocialPreview:
    """Keep the first share card. Fall back to the RSS line we actually saw."""
    parsed = parse_social_preview(html or "")
    title = (parsed.title or headline or "").strip() or None
    description = (parsed.description or (excerpt or "")).strip() or None
    if title:
        title = title[:2000]
    if description:
        description = description[:4000]
    return SocialPreview(
        title=title,
        description=description,
        image_url=parsed.image_url or _normalize_image_url(rss_image_url),
    )


async def fetch_html_prefix(
    url: str,
    *,
    limit: int,
    timeout: float,
    stop_at_head: bool,
) -> str | None:
    if not url.startswith(("http://", "https://")):
        return None
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            headers=_PAGE_HEADERS,
        ) as client:
            async with client.stream("GET", url) as response:
                if response.status_code >= 400:
                    return None
                buf = bytearray()
                async for chunk in response.aiter_bytes():
                    buf.extend(chunk)
                    if len(buf) >= limit:
                        break
                    if stop_at_head and b"</head>" in buf.lower():
                        break
                return bytes(buf[:limit]).decode("utf-8", errors="ignore")
    except Exception as exc:  # noqa: BLE001 — a missed preview must not fail ingest
        logger.debug("Page fetch failed for %s: %s", url, exc)
        return None


async def load_frozen_preview(
    url: str,
    *,
    headline: str,
    excerpt: str | None,
    rss_image_url: str | None,
) -> SocialPreview:
    html = await fetch_html_prefix(url, limit=48_000, timeout=4.0, stop_at_head=True)
    return freeze_social_preview(
        headline=headline,
        excerpt=excerpt,
        rss_image_url=rss_image_url,
        html=html,
    )


async def page_notes_correction(url: str) -> bool:
    html = await fetch_html_prefix(url, limit=150_000, timeout=6.0, stop_at_head=False)
    return text_notes_correction(html)
