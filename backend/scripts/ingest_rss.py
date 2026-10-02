"""Run RSS ingestion from the command line (requires DATABASE_URL)."""

import asyncio
import sys

from app.core.database import SessionLocal
from app.services.rss_ingestion import run_rss_ingest


async def main() -> int:
    async with SessionLocal() as session:
        result = await run_rss_ingest(session)

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
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
