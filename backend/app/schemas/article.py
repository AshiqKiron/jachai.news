from datetime import datetime

from pydantic import BaseModel, ConfigDict, HttpUrl


class ArticleBase(BaseModel):
    title: str
    url: HttpUrl
    excerpt: str | None = None
    image_url: HttpUrl | None = None
    published_at: datetime | None = None
    is_rumor: bool = False
    author: str | None = None
    section: str | None = None
    perspective: str | None = None
    rumor_flag_reason: str | None = None
    rumor_marked_at: datetime | None = None
    first_seen_at: datetime | None = None
    updated_at: datetime | None = None
    last_ingested_at: datetime | None = None
    availability_status: str | None = None
    last_availability_check: datetime | None = None
    removed_at: datetime | None = None
    removed_headline: str | None = None
    removed_excerpt: str | None = None
    archive_snapshot_url: str | None = None


class ArticleRead(ArticleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_id: int
    cluster_id: int | None = None


class ArticleListResponse(BaseModel):
    items: list[ArticleRead]
    total: int
