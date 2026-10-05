"""Run RSS ingestion from the command line (requires DATABASE_URL)."""

import argparse
import asyncio
import sys

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.ingest_queue import enqueue_rss_ingest
from app.services.ops_alerts import notify_ingest_failed, notify_ingest_finished, notify_ingest_started
from app.services.rss_ingestion import run_rss_ingest


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Shorup RSS ingestion")
    parser.add_argument(
        "--sync",
        action="store_true",
        help="Run in this process (default when Redis queue is disabled)",
    )
    parser.add_argument(
        "--queue",
        action="store_true",
        help="Enqueue on Celery (requires REDIS_URL and a worker on the ingest queue)",
    )
    return parser.parse_args()


async def _run_sync() -> int:
    await notify_ingest_started(channel="cli")
    try:
        async with SessionLocal() as session:
            result = await run_rss_ingest(session)
    except Exception as exc:
        await notify_ingest_failed(exc, channel="cli")
        raise

    print(
        f"Sources: {result.sources_processed} | "
        f"Fetched: {result.articles_fetched} | "
        f"Created: {result.articles_created} | "
        f"Duplicates skipped: {result.articles_skipped_duplicate} | "
        f"Clusters created: {result.clusters_created}"
    )
    if result.errors:
        print("Errors:", file=sys.stderr)
        for err in result.errors:
            print(f"  - {err}", file=sys.stderr)

    await notify_ingest_finished(result, channel="cli")
    return 1 if result.errors else 0


async def main() -> int:
    args = _parse_args()
    use_queue = args.queue or (settings.ingest_uses_queue and not args.sync)
    if use_queue:
        if not settings.redis_url:
            print("REDIS_URL is required to enqueue ingest.", file=sys.stderr)
            return 1
        task = enqueue_rss_ingest()
        print(f"Queued ingest job: {task.id}")
        return 0
    return await _run_sync()


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except Exception:
        raise SystemExit(1)
