"""Heuristic guardrails before expensive LLM calls (prompt-injection resistance)."""

from __future__ import annotations

import re
from dataclasses import dataclass

# Common instruction-override patterns (case-insensitive, multilingual fragments)
_INJECTION_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(pat, re.IGNORECASE)
    for pat in (
        r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
        r"disregard\s+(the\s+)?(system|developer)\s+(prompt|message)",
        r"you\s+are\s+now\s+(in\s+)?(developer|admin|god)\s+mode",
        r"<\s*/?\s*system\s*>",
        r"\[INST\]",
        r"###\s*instruction",
        r"jailbreak",
        r"do\s+not\s+follow\s+(the\s+)?(rules|policy)",
        r"output\s+(only\s+)?(json|yaml)\s+with\s+verdict\s*:\s*verified",
        r"pretend\s+you\s+are",
        r"new\s+system\s+prompt",
        r"forget\s+(everything|all|prior)",
        r"act\s+as\s+(a\s+)?(developer|admin|system)",
        r"reveal\s+(the\s+)?(system|hidden)\s+prompt",
        r"<\s*assistant\s*>",
        r"<\s*developer\s*>",
        r"\\n\s*system\s*:",
        r"base64\s+decode",
        r"execute\s+(this\s+)?(code|script|command)",
    )
)

_SUSPICIOUS_DENSITY_THRESHOLD = 3
_MAX_REPEAT_CHAR_RUN = 80
_MAX_ROLE_MARKERS = 6


@dataclass(frozen=True)
class GuardrailResult:
    allowed: bool
    reasons: tuple[str, ...]


def assess_user_content(text: str) -> GuardrailResult:
    reasons: list[str] = []
    hits = 0

    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            hits += 1
            reasons.append(f"Matched suspicious pattern: {pattern.pattern[:48]}")

    if hits >= _SUSPICIOUS_DENSITY_THRESHOLD:
        reasons.append("Too many injection-style patterns in one submission.")

    # Excessive role-play markers
    if text.count("```") > 8:
        reasons.append("Excessive code-fence markers.")

    role_markers = text.lower().count("system:") + text.lower().count("assistant:") + text.lower().count("user:")
    if role_markers > _MAX_ROLE_MARKERS:
        reasons.append("Too many chat-role markers.")

    if re.search(r"(.)\1{" + str(_MAX_REPEAT_CHAR_RUN - 1) + r",}", text):
        reasons.append("Excessive repeated characters.")

    allowed = len(reasons) == 0
    return GuardrailResult(allowed=allowed, reasons=tuple(reasons))
