from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.admin import (
    AdminIngestScheduleResponse,
    AdminIngestScheduleUpdate,
    AdminOverviewResponse,
    AdminSourceCreate,
    AdminSourceStat,
)
from app.schemas.ingest import IngestResponse
from app.services.admin_stats import get_admin_overview
from app.services.admin_sources import create_admin_source, remove_admin_source
from app.services.rss_ingestion import IngestResult, run_rss_ingest_for_source
from app.services.ingest_schedule import (
    ALLOWED_INGEST_INTERVAL_MINUTES,
    get_ingest_interval_minutes,
    get_ingest_last_scheduled_at,
    ingest_scheduler_active,
    set_ingest_interval_minutes,
)

router = APIRouter()


def _require_admin_key(x_admin_key: str | None) -> None:
    if settings.admin_api_key and x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin key")


def _ingest_response_from_result(result: IngestResult) -> IngestResponse:
    return IngestResponse(
        sources_processed=result.sources_processed,
        articles_fetched=result.articles_fetched,
        articles_created=result.articles_created,
        articles_skipped_duplicate=result.articles_skipped_duplicate,
        clusters_created=result.clusters_created,
        clusters_updated=result.clusters_updated,
        errors=result.errors,
    )


async def _ingest_schedule_response(session: AsyncSession) -> AdminIngestScheduleResponse:
    return AdminIngestScheduleResponse(
        interval_minutes=await get_ingest_interval_minutes(session),
        allowed_intervals_minutes=list(ALLOWED_INGEST_INTERVAL_MINUTES),
        scheduler_enabled=ingest_scheduler_active(),
        last_scheduled_at=await get_ingest_last_scheduled_at(session),
    )


@router.get("/overview", response_model=AdminOverviewResponse)
async def admin_overview(
    db: AsyncSession = Depends(get_db),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> AdminOverviewResponse:
    _require_admin_key(x_admin_key)
    return await get_admin_overview(db)


@router.get("/ingest-schedule", response_model=AdminIngestScheduleResponse)
async def admin_get_ingest_schedule(
    db: AsyncSession = Depends(get_db),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> AdminIngestScheduleResponse:
    _require_admin_key(x_admin_key)
    return await _ingest_schedule_response(db)


@router.patch("/ingest-schedule", response_model=AdminIngestScheduleResponse)
async def admin_update_ingest_schedule(
    payload: AdminIngestScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> AdminIngestScheduleResponse:
    _require_admin_key(x_admin_key)
    try:
        await set_ingest_interval_minutes(db, payload.interval_minutes)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    await db.commit()
    return await _ingest_schedule_response(db)


@router.post("/sources", response_model=AdminSourceStat, status_code=status.HTTP_201_CREATED)
async def admin_create_source(
    payload: AdminSourceCreate,
    db: AsyncSession = Depends(get_db),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> AdminSourceStat:
    _require_admin_key(x_admin_key)
    return await create_admin_source(db, payload)


@router.delete("/sources/{source_id}", response_model=AdminSourceStat)
async def admin_remove_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> AdminSourceStat:
    _require_admin_key(x_admin_key)
    return await remove_admin_source(db, source_id)


@router.post("/sources/{source_id}/ingest", response_model=IngestResponse)
async def admin_ingest_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> IngestResponse:
    _require_admin_key(x_admin_key)
    try:
        result = await run_rss_ingest_for_source(db, source_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    return _ingest_response_from_result(result)
