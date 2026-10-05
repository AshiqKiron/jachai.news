from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "shorup",
    broker=settings.redis_url or "redis://localhost:6379/0",
    backend=settings.redis_url or "redis://localhost:6379/0",
)
celery_app.conf.task_routes = {
    "app.workers.verification_tasks.*": {"queue": "verification"},
    "app.workers.ingest_tasks.*": {"queue": "ingest"},
}
if settings.ingest_scheduler_enabled and settings.redis_url:
    celery_app.conf.beat_schedule = {
        "rss-ingest-scheduler-tick": {
            "task": "app.workers.ingest_tasks.scheduled_ingest_tick",
            "schedule": 60.0,
            "options": {"queue": "ingest"},
        },
    }
celery_app.autodiscover_tasks(["app.workers"])
