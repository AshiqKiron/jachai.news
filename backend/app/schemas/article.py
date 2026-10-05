from datetime import datetime

from pydantic import BaseModel, ConfigDict, HttpUrl


class ArticleBase(BaseModel):
    title: str
    url: HttpUrl
    excerpt: str | None = None
    image_url: HttpUrl | None = None
    published_at: datetime | None = None
    is_rumor: bool = False


class ArticleRead(ArticleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_id: int
    cluster_id: int | None = None


class ArticleListResponse(BaseModel):
    items: list[ArticleRead]
    total: int
