import hashlib
import math
import struct

import httpx

from app.core.config import settings

EMBEDDING_DIM = 768


def _local_deterministic_embedding(text: str, dim: int = EMBEDDING_DIM) -> list[float]:
    """Dev fallback when no embedding API key — identical text only matches."""
    normalized = " ".join(text.lower().split())
    seed = hashlib.sha256(normalized.encode("utf-8")).digest()
    values: list[float] = []
    counter = 0
    while len(values) < dim:
        block = hashlib.sha256(seed + counter.to_bytes(4, "big")).digest()
        counter += 1
        for i in range(0, len(block) - 3, 4):
            values.append(struct.unpack("f", block[i : i + 4])[0])
            if len(values) >= dim:
                break
    norm = math.sqrt(sum(v * v for v in values)) or 1.0
    return [v / norm for v in values]


async def embed_text(text: str) -> list[float]:
    if settings.gemini_api_key:
        return await _gemini_embed(text)
    return _local_deterministic_embedding(text)


async def _gemini_embed(text: str) -> list[float]:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"text-embedding-004:embedContent?key={settings.gemini_api_key}"
    )
    payload = {
        "model": "models/text-embedding-004",
        "content": {"parts": [{"text": text[:8000]}]},
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
    values = data["embedding"]["values"]
    if len(values) != EMBEDDING_DIM:
        raise ValueError(f"Unexpected embedding dimension: {len(values)}")
    return values


def embedding_to_pgvector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in values) + "]"
