import hashlib
import re
import unicodedata


def slugify_claim(claim_text: str) -> str:
    normalized = unicodedata.normalize("NFKD", claim_text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug_base = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_text.lower()).strip("-")
    slug_base = slug_base[:80] or "claim"
    digest = hashlib.sha256(claim_text.encode("utf-8")).hexdigest()[:10]
    return f"{slug_base}-{digest}"
