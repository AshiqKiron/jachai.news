from sqlalchemy import Boolean, Float, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    feed_url: Mapped[str] = mapped_column(String(2048))
    bias_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # -1 left .. +1 right
    disabled: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    ingest_mode: Mapped[str] = mapped_column(String(16), default="rss", server_default="rss")
    owner_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    parent_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    parent_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    homepage_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    language: Mapped[str] = mapped_column(String(8), default="bn", server_default="bn")
    factuality: Mapped[str | None] = mapped_column(String(32), nullable=True)
    additional_feed_urls: Mapped[list[str]] = mapped_column(
        ARRAY(String(2048)),
        default=list,
        server_default="{}",
    )

    articles: Mapped[list["Article"]] = relationship(back_populates="source")
