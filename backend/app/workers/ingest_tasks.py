"""Celery worker entry points for RSS ingestion (decoupled from the API process)."""

import asyncio

from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.ingest_tasks.run_rss_ingest_task")
def run_rss_ingest_task() -> dict[str, object]:
    return asyncio.run(_run_rss_ingest())


@celery_app.task(name="app.workers.ingest_tasks.scheduled_ingest_tick")
def scheduled_ingest_tick() -> dict[str, object]:
    return asyncio.run(_scheduled_ingest_tick())


async def _scheduled_ingest_tick() -> dict[str, object]:
    from app.core.database import SessionLocal
    from app.services.ingest_schedule import run_scheduled_ingest_if_due

    async with SessionLocal() as session:
        return await run_scheduled_ingest_if_due(session)


async def _run_rss_ingest() -> dict[str, object]:
    from app.core.database import SessionLocal
    from app.services.ops_alerts import notify_ingest_failed, notify_ingest_finished, notify_ingest_started
    from app.services.rss_ingestion import run_rss_ingest

    await notify_ingest_started(channel="worker")
    try:
        async with SessionLocal() as session:
            result = await run_rss_ingest(session)
    except Exception as exc:
        await notify_ingest_failed(exc, channel="worker")
        raise

    await notify_ingest_finished(result, channel="worker")
    return {
        "sources_processed": result.sources_processed,
        "articles_fetched": result.articles_fetched,
        "articles_created": result.articles_created,
        "articles_skipped_duplicate": result.articles_skipped_duplicate,
        "clusters_created": result.clusters_created,
        "clusters_updated": result.clusters_updated,
        "errors": result.errors,
    }
