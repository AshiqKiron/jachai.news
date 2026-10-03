from pydantic import BaseModel, Field


class IngestResponse(BaseModel):
    sources_processed: int
    articles_fetched: int
    articles_created: int
    articles_skipped_duplicate: int
    clusters_created: int
    clusters_updated: int
    errors: list[str] = Field(default_factory=list)


class IngestAcceptedResponse(BaseModel):
    job_id: str
    status: str = "queued"


class IngestJobStatusResponse(BaseModel):
    job_id: str
    status: str
    result: IngestResponse | None = None
    error: str | None = None
