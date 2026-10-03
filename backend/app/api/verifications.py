import json

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.verified_claim import VerifiedClaim
from app.schemas.verification import (
    VerificationCreate,
    VerificationCreateResponse,
    VerificationJobRead,
    VerificationSearchResponse,
    VerifiedClaimListResponse,
    VerifiedClaimRead,
)
from app.services.semantic_cache import find_semantic_cache_hit
from app.services.verification_job_stream import watch_verification_job
from app.services.verification_jobs import create_job, enqueue_verification_task, get_job
from app.services.verification_pipeline import get_claim_by_slug, persist_cache_hit_row
from app.services.verification_runner import execute_verification_job

router = APIRouter()


def _job_event_payload(job: dict) -> dict:
    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "progress": job.get("progress", 0),
        "slug": job.get("slug"),
        "message": job.get("message"),
        "cached": bool(job.get("cached")),
    }


@router.post("", response_model=VerificationCreateResponse)
async def create_verification(
    body: VerificationCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> VerificationCreateResponse:
    claim_text = body.claim.strip()
    cache_hit = await find_semantic_cache_hit(db, claim_text)
    if cache_hit:
        row = await persist_cache_hit_row(db, claim_text, cache_hit)
        return VerificationCreateResponse(
            cached=True,
            verification=VerifiedClaimRead.model_validate(row),
        )

    job_id = create_job(claim_text=claim_text)
    if not enqueue_verification_task(job_id):
        background_tasks.add_task(execute_verification_job, job_id)

    return VerificationCreateResponse(job_id=job_id, cached=False)


@router.get("/jobs/{job_id}", response_model=VerificationJobRead)
async def get_verification_job(job_id: str) -> VerificationJobRead:
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return VerificationJobRead(
        job_id=job["job_id"],
        status=job["status"],
        progress=int(job.get("progress", 0)),
        slug=job.get("slug"),
        message=job.get("message"),
        cached=bool(job.get("cached")),
    )


@router.get("/jobs/{job_id}/events")
async def stream_verification_job(job_id: str) -> StreamingResponse:
    async def event_stream():
        async for job in watch_verification_job(job_id):
            if job.get("error") == "not_found":
                yield f"event: error\ndata: {json.dumps({'message': 'Job not found'})}\n\n"
                return
            yield f"data: {json.dumps(_job_event_payload(job))}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.websocket("/jobs/{job_id}/ws")
async def websocket_verification_job(websocket: WebSocket, job_id: str) -> None:
    await websocket.accept()
    try:
        async for job in watch_verification_job(job_id):
            if job.get("error") == "not_found":
                await websocket.send_json({"error": "not_found", "message": "Job not found"})
                return
            await websocket.send_json(_job_event_payload(job))
    except WebSocketDisconnect:
        return


@router.get("", response_model=VerifiedClaimListResponse)
async def list_verifications(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> VerifiedClaimListResponse:
    filters = VerifiedClaim.status == "completed"
    total = await db.scalar(select(func.count()).select_from(VerifiedClaim).where(filters))
    result = await db.execute(
        select(VerifiedClaim)
        .where(filters)
        .order_by(VerifiedClaim.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = [VerifiedClaimRead.model_validate(row) for row in result.scalars().all()]
    return VerifiedClaimListResponse(items=items, total=total or 0)


@router.get("/search", response_model=VerificationSearchResponse)
async def search_verifications(
    q: str = Query(..., min_length=2, max_length=200),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
) -> VerificationSearchResponse:
    count_row = await db.execute(
        text(
            """
            SELECT COUNT(*) AS total
            FROM verified_claims
            WHERE status = 'completed'
              AND search_vector @@ websearch_to_tsquery('english', :q)
            """
        ),
        {"q": q},
    )
    total = int(count_row.scalar_one() or 0)

    rows = await db.execute(
        text(
            """
            SELECT id, slug, claim_text, verdict, analysis, tags, status,
                   cache_source_id, created_at, updated_at
            FROM verified_claims
            WHERE status = 'completed'
              AND search_vector @@ websearch_to_tsquery('english', :q)
            ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', :q)) DESC,
                     created_at DESC
            LIMIT :limit OFFSET :offset
            """
        ),
        {"q": q, "limit": limit, "offset": offset},
    )
    items = [VerifiedClaimRead.model_validate(dict(row)) for row in rows.mappings().all()]
    return VerificationSearchResponse(items=items, total=total, query=q)


@router.get("/{slug}", response_model=VerifiedClaimRead)
async def get_verification(slug: str, db: AsyncSession = Depends(get_db)) -> VerifiedClaimRead:
    claim = await get_claim_by_slug(db, slug)
    if not claim or claim.status != "completed":
        raise HTTPException(status_code=404, detail="Verification not found")
    return VerifiedClaimRead.model_validate(claim)
