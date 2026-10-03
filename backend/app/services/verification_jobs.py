import json
import uuid
from typing import Any

from app.core.config import settings

TERMINAL_JOB_STATUSES = frozenset({"completed", "failed", "cached"})

_memory_jobs: dict[str, dict[str, Any]] = {}
_redis_client = None


def _redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if not settings.redis_url:
        return None
    try:
        import redis

        _redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
        _redis_client.ping()
    except Exception:
        _redis_client = None
    return _redis_client


def _job_key(job_id: str) -> str:
    return f"verification:job:{job_id}"


def create_job(claim_text: str, source_url: str | None = None) -> str:
    job_id = str(uuid.uuid4())
    payload = {
        "job_id": job_id,
        "status": "pending",
        "progress": 0,
        "slug": None,
        "message": "Queued",
        "cached": False,
        "claim_text": claim_text,
        "source_url": source_url,
    }
    client = _redis()
    if client:
        client.set(_job_key(job_id), json.dumps(payload), ex=settings.verification_job_ttl_seconds)
        return job_id
    _memory_jobs[job_id] = payload
    return job_id


def update_job(job_id: str, **fields: Any) -> None:
    client = _redis()
    if client:
        raw = client.get(_job_key(job_id))
        if not raw:
            return
        payload = json.loads(raw)
        payload.update(fields)
        client.set(_job_key(job_id), json.dumps(payload), ex=settings.verification_job_ttl_seconds)
        client.publish(_job_key(job_id), json.dumps(payload))
        return
    if job_id in _memory_jobs:
        _memory_jobs[job_id].update(fields)


def get_job(job_id: str) -> dict[str, Any] | None:
    client = _redis()
    if client:
        raw = client.get(_job_key(job_id))
        if not raw:
            return None
        return json.loads(raw)
    return _memory_jobs.get(job_id)


def enqueue_verification_task(job_id: str) -> bool:
    """Enqueue Celery task when Redis broker is configured; else caller runs in-process."""
    if not settings.redis_url:
        return False
    try:
        from app.workers.verification_tasks import run_verification_job

        run_verification_job.delay(job_id)
        return True
    except Exception:
        return False
