from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.ingest import IngestResponse
from app.services.ops_alerts import notify_ingest_failed, notify_ingest_finished
from app.services.rss_ingestion import run_rss_ingest

router = APIRouter()


@router.post("", response_model=IngestResponse)
async def trigger_rss_ingest(
    db: AsyncSession = Depends(get_db),
    x_ingest_key: str | None = Header(default=None, alias="X-Ingest-Key"),
) -> IngestResponse:
    if settings.ingest_api_key and x_ingest_key != settings.ingest_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid ingest key")

    try:
        result = await run_rss_ingest(db)
    except Exception as exc:
        await notify_ingest_failed(exc, channel="api")
        raise

    await notify_ingest_finished(result, channel="api")
    return IngestResponse(
        sources_processed=result.sources_processed,
        articles_fetched=result.articles_fetched,
        articles_created=result.articles_created,
        articles_skipped_duplicate=result.articles_skipped_duplicate,
        clusters_created=result.clusters_created,
        clusters_updated=result.clusters_updated,
        errors=result.errors,
    )
