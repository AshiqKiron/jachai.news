from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Cluster(Base):
    __tablename__ = "clusters"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    title: Mapped[str] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    topic_id: Mapped[str] = mapped_column(String(32), default="news", server_default="news")
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    category_bn: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_article_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # embedding column managed via migration 009; optional semantic search later.

    articles: Mapped[list["Article"]] = relationship(back_populates="cluster")
