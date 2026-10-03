"""Enqueue RSS ingest jobs on Celery (requires Redis broker)."""

from __future__ import annotations

from celery.result import AsyncResult

from app.schemas.ingest import IngestJobStatusResponse, IngestResponse
from app.workers.celery_app import celery_app
from app.workers.ingest_tasks import run_rss_ingest_task


def enqueue_rss_ingest() -> AsyncResult:
    return run_rss_ingest_task.apply_async(queue="ingest")


def get_ingest_job_status(task_id: str) -> IngestJobStatusResponse:
    result = AsyncResult(task_id, app=celery_app)
    state = result.state or "PENDING"

    if state == "SUCCESS":
        payload = result.result if isinstance(result.result, dict) else {}
        return IngestJobStatusResponse(
            job_id=task_id,
            status=state,
            result=IngestResponse.model_validate(payload),
        )

    if state == "FAILURE":
        error = str(result.result) if result.result is not None else "Ingest task failed."
        return IngestJobStatusResponse(job_id=task_id, status=state, error=error)

    return IngestJobStatusResponse(job_id=task_id, status=state)
