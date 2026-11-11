"""Match the same news event across Bangla and English headlines.

Title overlap still decides same-language near-duplicates. This score is the
other signal: shared places, teams, and topics, so a Bangla desk and an English
desk can land in one cluster. Article headlines are left as published.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

_BENGALI = re.compile(r"[\u0980-\u09FF]")
_BN_CHAR = r"[\u0980-\u09FF]"
_BN_SUFFIX = r"(?:ের|তে|কে|টির|টার|টি|টা|ে|র|য়|য়)?"
_BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")

# Topics that only count when a place such as Dhaka is also shared.
_PLACE_SCOPED_TOPICS = frozenset({"air_pollution"})


@dataclass(frozen=True)
class _Entity:
    id: str
    kind: str  # anchor | topic | generic
    aliases: tuple[str, ...]


# Anchors are specific enough that one shared hit can join headlines.
# Topics need a second hit, or they cancel the anchor when each side names a different one.
_ENTITIES: tuple[_Entity, ...] = (
    _Entity("padma_bridge", "anchor", ("padma bridge", "padma toll", "padma", "পদ্মা সেতু", "পদ্মা")),
    _Entity("buriganga", "anchor", ("buriganga", "বুড়িগঙ্গা")),
    _Entity(
        "st_martins",
        "anchor",
        ("saint martin's", "saint martins", "st. martin's", "st. martin", "st martin", "সেন্ট মার্টিন"),
    ),
    _Entity("sundarbans", "anchor", ("sundarbans", "sundarban", "সুন্দরবন")),
    _Entity("abahani", "anchor", ("abahani", "আবাহনী")),
    _Entity("mohammedan", "anchor", ("mohammedan", "মোহামেডান")),
    _Entity("dhaka_derby", "anchor", ("dhaka derby", "ঢাকা ডার্বি", "derby", "ডার্বি")),
    _Entity("saff", "anchor", ("saff", "সাফ")),
    _Entity("asia_cup", "anchor", ("asia cup", "এশিয়া কাপ", "এশিয়া কাপ")),
    _Entity("metro", "anchor", ("metro", "মেট্রো")),
    _Entity("remittance", "anchor", ("remittance", "রেমিট্যান্স")),
    _Entity("toll", "topic", ("toll", "ভাড়া")),
    _Entity("plastic", "topic", ("plastic", "প্লাস্টিক")),
    _Entity("coral", "topic", ("coral", "প্রবাল")),
    _Entity("tiger", "topic", ("tiger", "বাঘ")),
    _Entity(
        "air_pollution",
        "topic",
        ("air quality", "air pollution", "smog", "বায়ু দূষণ", "বায়ু দূষণ"),
    ),
    _Entity("schedule", "topic", ("schedule", "সময়সূচি")),
    _Entity("women", "topic", ("women", "woman", "নারী")),
    _Entity("final", "topic", ("final", "ফাইনাল")),
    _Entity("semifinal", "topic", ("semifinal", "semi-final", "সেমিফাইনাল")),
    _Entity("september", "topic", ("september", "সেপ্টেম্বর")),
    _Entity("record", "topic", ("record", "রেকর্ড")),
    _Entity("accident", "topic", ("accident", "crash", "collision", "দুর্ঘটনা")),
    _Entity("fire", "topic", ("fire", "wildfire", "blaze", "আগুন")),
    _Entity("dhaka", "generic", ("dhaka", "ঢাকা")),
)


@dataclass(frozen=True)
class _Signals:
    anchors: frozenset[str]
    topics: frozenset[str]
    generics: frozenset[str]
    numbers: frozenset[str]


def has_bengali(text: str) -> bool:
    return bool(_BENGALI.search(text))


def prefer_bangla_title(current: str, incoming: str, *, max_length: int = 512) -> str:
    """Use a Bangla headline as the story title once one exists. Keep the first Bangla title."""
    incoming_clean = " ".join(incoming.split())
    if incoming_clean and has_bengali(incoming_clean) and not has_bengali(current):
        return incoming_clean[:max_length]
    return current


def cross_lingual_score(a: str, b: str) -> float:
    """0–1 score for two headlines about the same event. 0 when the signal is too thin."""
    left = _signals(a)
    right = _signals(b)
    shared_anchors = left.anchors & right.anchors
    shared_topics = left.topics & right.topics
    if shared_anchors:
        if left.topics and right.topics and not shared_topics:
            return 0.0
        bonus = 0.04 * min(len(shared_anchors) - 1, 2)
        if shared_topics:
            bonus += 0.04
        return min(0.92, 0.64 + bonus)
    if len(shared_topics) >= 2 or (shared_topics and (left.numbers & right.numbers)):
        return 0.56
    if (shared_topics & _PLACE_SCOPED_TOPICS) and (left.generics & right.generics):
        return 0.52
    return 0.0


def _fold(text: str) -> str:
    folded = unicodedata.normalize("NFKC", text).casefold()
    folded = folded.replace("’", "'").replace("`", "'")
    folded = folded.replace("য়", "য়").replace("ড়", "ড়").replace("ঢ়", "ঢ়")
    return folded.translate(_BN_DIGITS)


def _contains_alias(text: str, alias: str) -> bool:
    """`text` and matching are both already folded."""
    folded_alias = _fold(alias)
    if re.search(r"[a-z]", folded_alias):
        return (
            re.search(
                rf"(?<![a-z0-9]){re.escape(folded_alias)}s?(?![a-z0-9])",
                text,
            )
            is not None
        )
    lookbehind = r"(?<!সেমি)" if folded_alias == _fold("ফাইনাল") else rf"(?<!{_BN_CHAR})"
    pattern = lookbehind + re.escape(folded_alias) + _BN_SUFFIX + rf"(?!{_BN_CHAR})"
    return re.search(pattern, text) is not None


def _is_election_commission(text: str) -> bool:
    if _contains_alias(text, "election commission") or _contains_alias(text, "নির্বাচন কমিশন"):
        return True
    if re.search(r"(?<![a-z0-9])ec(?![a-z0-9])", text):
        return True
    has_commission = _contains_alias(text, "commission") or _contains_alias(text, "কমিশন")
    has_election = any(
        _contains_alias(text, alias)
        for alias in ("election", "নির্বাচন", "schedule", "সময়সূচি")
    )
    return has_commission and has_election


def _numbers(text: str) -> frozenset[str]:
    found: set[str] = set()
    for raw in re.findall(r"\d+(?:\.\d+)?", text):
        if re.fullmatch(r"(?:19|20)\d{2}", raw):
            continue
        if "." not in raw and len(raw) < 2:
            continue
        found.add(raw.lstrip("0") or "0")
    return frozenset(found)


def _signals(title: str) -> _Signals:
    text = _fold(title)
    anchors: set[str] = set()
    topics: set[str] = set()
    generics: set[str] = set()
    for entity in _ENTITIES:
        if not any(_contains_alias(text, alias) for alias in entity.aliases):
            continue
        if entity.kind == "anchor":
            anchors.add(entity.id)
        elif entity.kind == "topic":
            topics.add(entity.id)
        else:
            generics.add(entity.id)
    if _is_election_commission(text):
        anchors.add("election_commission")
    return _Signals(
        frozenset(anchors),
        frozenset(topics),
        frozenset(generics),
        _numbers(text),
    )
