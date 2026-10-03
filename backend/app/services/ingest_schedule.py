from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.app_setting import AppSetting
from app.services.ingest_queue import enqueue_rss_ingest

INGEST_INTERVAL_MINUTES_KEY = "ingest_interval_minutes"
INGEST_LAST_SCHEDULED_AT_KEY = "ingest_last_scheduled_at"

ALLOWED_INGEST_INTERVAL_MINUTES: tuple[int, ...] = (15, 30, 60, 120, 360, 720, 1440)


def ingest_scheduler_active() -> bool:
    return bool(settings.ingest_scheduler_enabled and settings.redis_url)


async def _get_setting(session: AsyncSession, key: str) -> str | None:
    return await session.scalar(select(AppSetting.value).where(AppSetting.key == key))


async def _set_setting(session: AsyncSession, key: str, value: str) -> None:
    row = await session.get(AppSetting, key)
    if row is None:
        session.add(AppSetting(key=key, value=value))
    else:
        row.value = value


async def get_ingest_interval_minutes(session: AsyncSession) -> int:
    raw = await _get_setting(session, INGEST_INTERVAL_MINUTES_KEY)
    if raw is None:
        return settings.ingest_interval_minutes_default
    try:
        minutes = int(raw)
    except ValueError:
        return settings.ingest_interval_minutes_default
    if minutes not in ALLOWED_INGEST_INTERVAL_MINUTES:
        return settings.ingest_interval_minutes_default
    return minutes


async def set_ingest_interval_minutes(session: AsyncSession, minutes: int) -> int:
    if minutes not in ALLOWED_INGEST_INTERVAL_MINUTES:
        raise ValueError(f"Unsupported ingest interval: {minutes}")
    await _set_setting(session, INGEST_INTERVAL_MINUTES_KEY, str(minutes))
    return minutes


async def get_ingest_last_scheduled_at(session: AsyncSession) -> datetime | None:
    raw = await _get_setting(session, INGEST_LAST_SCHEDULED_AT_KEY)
    if not raw:
        return None
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


async def mark_ingest_scheduled(session: AsyncSession, when: datetime | None = None) -> None:
    moment = when or datetime.now(timezone.utc)
    await _set_setting(session, INGEST_LAST_SCHEDULED_AT_KEY, moment.isoformat())


async def run_scheduled_ingest_if_due(session: AsyncSession) -> dict[str, object]:
    if not ingest_scheduler_active():
        return {"triggered": False, "reason": "scheduler_disabled"}

    interval = await get_ingest_interval_minutes(session)
    last = await get_ingest_last_scheduled_at(session)
    now = datetime.now(timezone.utc)
    if last is not None and now - last < timedelta(minutes=interval):
        return {"triggered": False, "reason": "not_due", "interval_minutes": interval}

    await mark_ingest_scheduled(session, now)
    await session.commit()

    if settings.ingest_uses_queue:
        task = enqueue_rss_ingest()
        return {"triggered": True, "job_id": task.id, "interval_minutes": interval}

    from app.services.ops_alerts import notify_ingest_failed, notify_ingest_finished, notify_ingest_started
    from app.services.rss_ingestion import run_rss_ingest

    await notify_ingest_started(channel="scheduler")
    try:
        result = await run_rss_ingest(session)
    except Exception as exc:
        await notify_ingest_failed(exc, channel="scheduler")
        raise
    await notify_ingest_finished(result, channel="scheduler")
    return {
        "triggered": True,
        "inline": True,
        "interval_minutes": interval,
        "articles_created": result.articles_created,
    }
