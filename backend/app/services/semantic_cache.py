from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.embeddings import embed_text, embedding_to_pgvector_literal


async def find_semantic_cache_hit(session: AsyncSession, claim_text: str) -> dict | None:
    """Return nearest completed verification if cosine similarity exceeds threshold."""
    embedding = await embed_text(claim_text)
    vector_literal = embedding_to_pgvector_literal(embedding)

    row = await session.execute(
        text(
            """
            SELECT id, slug, claim_text, verdict, analysis, tags, status,
                   cache_source_id, created_at, updated_at,
                   (1 - (embedding <=> CAST(:query_vec AS vector))) AS similarity
            FROM verified_claims
            WHERE status = 'completed'
              AND embedding IS NOT NULL
            ORDER BY embedding <=> CAST(:query_vec AS vector)
            LIMIT 1
            """
        ),
        {"query_vec": vector_literal},
    )
    match = row.mappings().first()
    if not match:
        return None
    if float(match["similarity"]) < settings.semantic_cache_min_similarity:
        return None
    return dict(match)
