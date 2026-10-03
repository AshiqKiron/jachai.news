"""Sanitize untrusted text and URLs before they reach LLM pipelines."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from urllib.parse import urlparse

# Hard caps — denial-of-wallet and prompt-bloat protection
MAX_USER_TEXT_CHARS = 8_000
MAX_HEADLINE_CHARS = 500
MAX_HEADLINES_PER_CLUSTER = 12
MAX_URL_CHARS = 2_048

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_ZERO_WIDTH = re.compile(r"[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]")


@dataclass(frozen=True)
class SanitizedUserInput:
    text: str
    truncated: bool
    source_url: str | None = None


class InputValidationError(ValueError):
    """Raised when input cannot be safely used."""


def _normalize_whitespace(text: str) -> str:
    collapsed = re.sub(r"\s+", " ", text.strip())
    return collapsed


def strip_invisible_and_controls(text: str) -> str:
    without_zw = _ZERO_WIDTH.sub("", text)
    return _CONTROL_CHARS.sub("", without_zw)


def sanitize_plain_text(text: str, *, max_chars: int = MAX_USER_TEXT_CHARS) -> SanitizedUserInput:
    if not text or not text.strip():
        raise InputValidationError("Text is required.")

    cleaned = strip_invisible_and_controls(unicodedata.normalize("NFKC", text))
    cleaned = _normalize_whitespace(cleaned)
    truncated = len(cleaned) > max_chars
    if truncated:
        cleaned = cleaned[:max_chars]
    return SanitizedUserInput(text=cleaned, truncated=truncated)


def sanitize_headline(title: str) -> str:
    cleaned = strip_invisible_and_controls(unicodedata.normalize("NFKC", title))
    cleaned = _normalize_whitespace(cleaned)
    if len(cleaned) > MAX_HEADLINE_CHARS:
        cleaned = cleaned[:MAX_HEADLINE_CHARS]
    return cleaned


def sanitize_headlines(headlines: list[str]) -> list[str]:
    limited = headlines[:MAX_HEADLINES_PER_CLUSTER]
    return [sanitize_headline(h) for h in limited if h and h.strip()]


def validate_http_url(url: str) -> str:
    if len(url) > MAX_URL_CHARS:
        raise InputValidationError("URL is too long.")

    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https"):
        raise InputValidationError("Only http and https URLs are allowed.")
    if not parsed.netloc:
        raise InputValidationError("Invalid URL.")

    host = parsed.hostname or ""
    lowered = host.lower()
    if lowered in ("localhost", "127.0.0.1", "0.0.0.0") or lowered.endswith(".local"):
        raise InputValidationError("Local URLs are not allowed.")

    return url.strip()


def wrap_user_content_for_prompt(user_text: str) -> str:
    """Delimit user content so model treats it as data, not instructions."""
    safe = user_text.replace("</user_content>", "")
    return f"<user_content>\n{safe}\n</user_content>"
