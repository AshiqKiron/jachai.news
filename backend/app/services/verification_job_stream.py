import asyncio
import json
from collections.abc import AsyncIterator
from typing import Any

from app.services.verification_jobs import TERMINAL_JOB_STATUSES, get_job

_POLL_SECONDS = 0.35


async def watch_verification_job(job_id: str) -> AsyncIterator[dict[str, Any]]:
    """Yield job payloads until a terminal status or the job disappears."""
    last_serialized = ""
    while True:
        job = get_job(job_id)
        if not job:
            yield {"error": "not_found"}
            return
        serialized = json.dumps(job, sort_keys=True)
        if serialized != last_serialized:
            yield job
            last_serialized = serialized
        if job.get("status") in TERMINAL_JOB_STATUSES:
            return
        await asyncio.sleep(_POLL_SECONDS)
