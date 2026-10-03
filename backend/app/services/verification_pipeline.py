from datetime import UTC, datetime

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.verified_claim import VerifiedClaim
from app.services.ai_client import ai_client
from app.services.ai_guardrails import assess_user_content
from app.services.ai_input_sanitizer import InputValidationError, sanitize_plain_text
from app.services.embeddings import embed_text, embedding_to_pgvector_literal
from app.services.semantic_cache import find_semantic_cache_hit
from app.services.verification_fetch import fetch_claim_source_text
from app.services.verification_jobs import update_job
from app.services.verification_slug import slugify_claim


async def resolve_submission_claim_text(claim_text: str, source_url: str | None) -> tuple[str, bool]:
    parts: list[str] = []
    truncated = False
    if claim_text.strip():
        sanitized = sanitize_plain_text(claim_text)
        truncated = sanitized.truncated
        parts.append(sanitized.text.strip())
    if source_url:
        parts.append(await fetch_claim_source_text(source_url))
    if not parts:
        raise InputValidationError("Provide text or url.")
    return "\n\n".join(parts).strip(), truncated


async def run_verification_pipeline(
    session: AsyncSession,
    job_id: str,
    claim_text: str,
    source_url: str | None = None,
) -> str:
    if source_url:
        update_job(job_id, status="processing", progress=8, message="Fetching source URL")
    else:
        update_job(job_id, status="processing", progress=10, message="Preparing claim")

    full_text, _ = await resolve_submission_claim_text(claim_text, source_url)
    sanitized = sanitize_plain_text(full_text)
    guard = assess_user_content(sanitized.text)
    if not guard.allowed:
        update_job(
            job_id,
            status="failed",
            progress=100,
            message="; ".join(guard.reasons) or "Submission blocked by safety checks.",
        )
        raise InputValidationError("Guardrail blocked submission.")

    normalized = sanitized.text.strip()
    update_job(job_id, progress=18, message="Checking semantic cache")
    cache_hit = await find_semantic_cache_hit(session, normalized)
    if cache_hit:
        row = await persist_cache_hit_row(session, normalized, cache_hit)
        update_job(
            job_id,
            status="cached",
            progress=100,
            slug=row.slug,
            message="Returned from semantic cache",
            cached=True,
        )
        return row.slug

    slug = slugify_claim(normalized)
    now = datetime.now(UTC)
    claim = VerifiedClaim(
        slug=slug,
        claim_text=normalized,
        verdict="pending",
        status="processing",
        created_at=now,
        updated_at=now,
    )
    session.add(claim)
    await session.flush()

    update_job(job_id, progress=40, message="Running AI analysis")
    result = await ai_client.verify_claim(normalized)

    update_job(job_id, progress=75, message="Indexing for search")
    embedding = await embed_text(normalized)
    vector_literal = embedding_to_pgvector_literal(embedding)

    claim.verdict = result["verdict"]
    claim.analysis = result["analysis"]
    claim.tags = result.get("tags") or None
    claim.status = "completed"
    claim.updated_at = datetime.now(UTC)
    await session.flush()

    await session.execute(
        text("UPDATE verified_claims SET embedding = CAST(:vec AS vector) WHERE id = :id"),
        {"vec": vector_literal, "id": claim.id},
    )
    await session.commit()

    update_job(
        job_id,
        status="completed",
        progress=100,
        slug=slug,
        message="Verification complete",
    )
    return slug


async def persist_cache_hit_row(
    session: AsyncSession,
    claim_text: str,
    source: dict,
) -> VerifiedClaim:
    slug = slugify_claim(claim_text)
    now = datetime.now(UTC)
    row = VerifiedClaim(
        slug=slug,
        claim_text=claim_text,
        verdict=source["verdict"],
        analysis=source["analysis"],
        tags=source.get("tags"),
        status="completed",
        cache_source_id=source["id"],
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    await session.flush()

    embedding = await embed_text(claim_text)
    vector_literal = embedding_to_pgvector_literal(embedding)
    await session.execute(
        text("UPDATE verified_claims SET embedding = CAST(:vec AS vector) WHERE id = :id"),
        {"vec": vector_literal, "id": row.id},
    )
    await session.commit()
    await session.refresh(row)
    return row


async def get_claim_by_slug(session: AsyncSession, slug: str) -> VerifiedClaim | None:
    result = await session.execute(select(VerifiedClaim).where(VerifiedClaim.slug == slug))
    return result.scalar_one_or_none()
