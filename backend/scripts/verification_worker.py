"""Run Celery worker for async claim verification (requires REDIS_URL)."""

from app.workers.celery_app import celery_app

if __name__ == "__main__":
    celery_app.worker_main(argv=["worker", "-Q", "verification", "-l", "info"])
