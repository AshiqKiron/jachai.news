import httpx

from app.core.database import SessionLocal
from app.services.ai_input_sanitizer import InputValidationError
from app.services.verification_jobs import get_job, update_job
from app.services.verification_job_store import persist_verification_job
from app.services.verification_pipeline import run_verification_pipeline


async def execute_verification_job(job_id: str) -> None:
    job = get_job(job_id)
    if not job:
        return
    claim_text = str(job.get("claim_text") or "")
    source_url = job.get("source_url")
    try:
        async with SessionLocal() as session:
            await run_verification_pipeline(
                session,
                job_id,
                claim_text=claim_text,
                source_url=source_url,
            )
    except httpx.HTTPError:
        update_job(job_id, status="failed", progress=100, message="Could not fetch URL content.")
        async with SessionLocal() as session:
            payload = get_job(job_id)
            if payload:
                await persist_verification_job(session, payload)
                await session.commit()
    except InputValidationError as exc:
        update_job(job_id, status="failed", progress=100, message=str(exc))
        async with SessionLocal() as session:
            payload = get_job(job_id)
            if payload:
                await persist_verification_job(session, payload)
                await session.commit()
    except Exception as exc:
        update_job(job_id, status="failed", progress=100, message=str(exc)[:500])
        async with SessionLocal() as session:
            payload = get_job(job_id)
            if payload:
                await persist_verification_job(session, payload)
                await session.commit()
