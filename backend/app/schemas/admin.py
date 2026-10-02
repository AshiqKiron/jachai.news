from datetime import datetime

from pydantic import BaseModel, Field


class AdminSourceStat(BaseModel):
    source_id: int
    name: str
    feed_url: str
    article_count: int
    bias_score: float | None


class AdminClusterPreview(BaseModel):
    id: int
    slug: str
    title: str
    created_at: datetime
    article_count: int


class AdminOverviewResponse(BaseModel):
    articles_total: int
    clusters_total: int
    sources_total: int
    rumors_total: int
    latest_article_at: datetime | None
    latest_cluster_at: datetime | None
    sources: list[AdminSourceStat] = Field(default_factory=list)
    recent_clusters: list[AdminClusterPreview] = Field(default_factory=list)
    ai_provider: str
    ingest_key_configured: bool
    groq_configured: bool
    gemini_configured: bool
