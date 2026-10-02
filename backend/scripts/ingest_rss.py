"""Run RSS ingestion from the command line (requires DATABASE_URL)."""

import asyncio
import sys

from app.core.database import SessionLocal
from app.services.ops_alerts import notify_ingest_failed, notify_ingest_finished, notify_ingest_started
from app.services.rss_ingestion import run_rss_ingest


async def main() -> int:
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


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except Exception:
        raise SystemExit(1)
