from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.article import ArticleRead


class ClusterRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    summary: str | None = None
    created_at: datetime


class ClusterDetail(ClusterRead):
    articles: list[ArticleRead] = []


class ClusterListResponse(BaseModel):
    items: list[ClusterRead]
    total: int
