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
if settings.redis_url:
    celery_app.conf.beat_schedule = {}
    if settings.ingest_scheduler_enabled:
        celery_app.conf.beat_schedule["rss-ingest-scheduler-tick"] = {
            "task": "app.workers.ingest_tasks.scheduled_ingest_tick",
            "schedule": 60.0,
            "options": {"queue": "ingest"},
        }
    if settings.availability_scheduler_enabled:
        celery_app.conf.beat_schedule["article-availability-tick"] = {
            "task": "app.workers.availability_tasks.scheduled_availability_tick",
            "schedule": settings.availability_check_interval_seconds,
            "options": {"queue": "ingest"},
        }
celery_app.autodiscover_tasks(["app.workers"])
