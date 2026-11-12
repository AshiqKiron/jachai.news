from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"), index=True)
    cluster_id: Mapped[int | None] = mapped_column(ForeignKey("clusters.id"), nullable=True, index=True)

    title: Mapped[str] = mapped_column(Text)
    url: Mapped[str] = mapped_column(String(2048), unique=True)
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_rumor: Mapped[bool] = mapped_column(Boolean, default=False)
    correction_noted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    social_preview_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    social_preview_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    social_preview_image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    social_preview_captured_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    source: Mapped["Source"] = relationship(back_populates="articles")
    cluster: Mapped["Cluster | None"] = relationship(back_populates="articles")
    titles: Mapped[list["ArticleTitle"]] = relationship(
        back_populates="article",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
