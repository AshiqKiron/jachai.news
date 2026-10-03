import asyncio

from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.verification_tasks.run_verification_job")
def run_verification_job(job_id: str) -> None:
    from app.services.verification_runner import execute_verification_job

    asyncio.run(execute_verification_job(job_id))
