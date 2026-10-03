from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.verify import VerifyResponse
from app.services.ai_guardrails import assess_user_content
from app.services.ai_input_sanitizer import InputValidationError, sanitize_plain_text, validate_http_url
from app.services.semantic_cache import find_semantic_cache_hit
from app.services.verification_jobs import create_job, enqueue_verification_task
from app.services.verification_pipeline import persist_cache_hit_row
from app.services.verification_runner import execute_verification_job


async def submit_verify_request(
    db: AsyncSession,
    background_tasks: BackgroundTasks,
    text: str | None,
    url: str | None,
) -> VerifyResponse:
    raw_text = (text or "").strip()
    source_url: str | None = None
    truncated = False

    if url and url.strip():
        try:
            source_url = validate_http_url(url)
        except InputValidationError as exc:
            raise exc

    if raw_text:
        try:
            sanitized = sanitize_plain_text(raw_text)
        except InputValidationError as exc:
            raise exc
        truncated = sanitized.truncated
        guard = assess_user_content(sanitized.text)
        if not guard.allowed:
            return VerifyResponse(
                accepted=False,
                guardrail_passed=False,
                truncated=truncated,
                blocked_reasons=list(guard.reasons),
            )
        normalized_text = sanitized.text.strip()
    else:
        normalized_text = ""

    if not normalized_text and not source_url:
        raise InputValidationError("Provide text or url.")

    # Semantic cache only when the full claim is known at submit time (no deferred URL fetch).
    if normalized_text and not source_url:
        cache_hit = await find_semantic_cache_hit(db, normalized_text)
        if cache_hit:
            row = await persist_cache_hit_row(db, normalized_text, cache_hit)
            return VerifyResponse(
                accepted=True,
                guardrail_passed=True,
                truncated=truncated,
                cached=True,
                slug=row.slug,
                verdict=row.verdict,
                analysis=row.analysis,
            )

    job_id = create_job(claim_text=normalized_text, source_url=source_url)
    if not enqueue_verification_task(job_id):
        background_tasks.add_task(execute_verification_job, job_id)

    return VerifyResponse(
        accepted=True,
        guardrail_passed=True,
        truncated=truncated,
        job_id=job_id,
    )
