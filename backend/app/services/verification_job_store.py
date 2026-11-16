"""Durable verification job rows (Redis remains the hot path for SSE)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.verification_job import VerificationJob


async def persist_verification_job(session: AsyncSession, payload: dict[str, Any]) -> None:
    job_id = UUID(str(payload["job_id"]))
    row = await session.scalar(select(VerificationJob).where(VerificationJob.job_id == job_id))
    now = datetime.now(timezone.utc)
    fields = {
        "status": str(payload.get("status") or "pending"),
        "progress": int(payload.get("progress") or 0),
        "slug": payload.get("slug"),
        "message": str(payload.get("message") or "Queued"),
        "cached": bool(payload.get("cached")),
        "claim_text": str(payload.get("claim_text") or ""),
        "source_url": payload.get("source_url"),
        "updated_at": now,
    }
    if row is None:
        session.add(
            VerificationJob(
                job_id=job_id,
                created_at=now,
                **fields,
            )
        )
    else:
        for key, value in fields.items():
            setattr(row, key, value)


async def load_verification_job(session: AsyncSession, job_id: str) -> dict[str, Any] | None:
    row = await session.scalar(select(VerificationJob).where(VerificationJob.job_id == UUID(job_id)))
    if row is None:
        return None
    return {
        "job_id": str(row.job_id),
        "status": row.status,
        "progress": row.progress,
        "slug": row.slug,
        "message": row.message,
        "cached": row.cached,
        "claim_text": row.claim_text,
        "source_url": row.source_url,
    }
