from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.article import ArticleRead


class ClusterArticleRead(ArticleRead):
    source_name: str
    bias_score: float | None = None
    owner_name: str | None = None
    owner_url: str | None = None
    parent_name: str | None = None
    parent_url: str | None = None
    original_title: str | None = None
    original_seen_at: datetime | None = None
    headline_edited_at: datetime | None = None
    correction_noted: bool = False
    social_preview_title: str | None = None
    social_preview_description: str | None = None
    social_preview_image_url: str | None = None


class ClusterRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    summary: str | None = None
    created_at: datetime


class ClusterDetail(ClusterRead):
    articles: list[ClusterArticleRead] = []


class ClusterListResponse(BaseModel):
    items: list[ClusterDetail]
    total: int
