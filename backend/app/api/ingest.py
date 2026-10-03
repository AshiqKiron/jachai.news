from fastapi import APIRouter, Header, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import SessionLocal
from app.schemas.ingest import IngestAcceptedResponse, IngestJobStatusResponse, IngestResponse
from app.services.ingest_queue import enqueue_rss_ingest, get_ingest_job_status
from app.services.ops_alerts import notify_ingest_failed, notify_ingest_finished
from app.services.rss_ingestion import IngestResult, run_rss_ingest

router = APIRouter()


def _check_ingest_key(x_ingest_key: str | None) -> None:
    if settings.ingest_api_key and x_ingest_key != settings.ingest_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid ingest key")


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


@router.post("", response_model=IngestResponse, responses={202: {"model": IngestAcceptedResponse}})
async def trigger_rss_ingest(
    x_ingest_key: str | None = Header(default=None, alias="X-Ingest-Key"),
):
    _check_ingest_key(x_ingest_key)

    if settings.ingest_uses_queue:
        task = enqueue_rss_ingest()
        body = IngestAcceptedResponse(job_id=task.id)
        return JSONResponse(status_code=status.HTTP_202_ACCEPTED, content=body.model_dump())

    try:
        async with SessionLocal() as db:
            result = await run_rss_ingest(db)
    except Exception as exc:
        await notify_ingest_failed(exc, channel="api")
        raise

    await notify_ingest_finished(result, channel="api")
    return _ingest_response_from_result(result)


@router.get("/jobs/{job_id}", response_model=IngestJobStatusResponse)
async def get_rss_ingest_job(
    job_id: str,
    x_ingest_key: str | None = Header(default=None, alias="X-Ingest-Key"),
) -> IngestJobStatusResponse:
    _check_ingest_key(x_ingest_key)
    if not settings.redis_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ingest job status requires REDIS_URL (Celery result backend).",
        )
    return get_ingest_job_status(job_id)
