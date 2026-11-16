"""Celery beat task — periodic article URL availability checks."""

import asyncio

from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.availability_tasks.scheduled_availability_tick")
def scheduled_availability_tick() -> dict[str, int]:
    return asyncio.run(_scheduled_availability_tick())


async def _scheduled_availability_tick() -> dict[str, int]:
    from app.core.config import settings
    from app.core.database import SessionLocal
    from app.services.article_availability_batch import run_availability_check_batch

    if not settings.redis_url or not settings.availability_scheduler_enabled:
        return {"checked": 0, "newly_removed": 0}

    async with SessionLocal() as session:
        return await run_availability_check_batch(
            session,
            batch_size=settings.availability_check_batch_size,
            stale_hours=settings.availability_stale_hours,
            lookback_days=settings.availability_lookback_days,
        )
