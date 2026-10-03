from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "jachai",
    broker=settings.redis_url or "redis://localhost:6379/0",
    backend=settings.redis_url or "redis://localhost:6379/0",
)
celery_app.conf.task_routes = {
    "app.workers.verification_tasks.*": {"queue": "verification"},
    "app.workers.ingest_tasks.*": {"queue": "ingest"},
}
celery_app.autodiscover_tasks(["app.workers"])
