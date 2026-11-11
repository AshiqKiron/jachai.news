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
