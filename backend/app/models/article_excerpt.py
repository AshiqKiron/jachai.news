from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ArticleExcerpt(Base):
    """Every distinct RSS excerpt wording for an article."""

    __tablename__ = "article_excerpts"
    __table_args__ = (
        Index(
            "article_excerpts_article_id_md5_uidx",
            "article_id",
            text("md5(excerpt)"),
            unique=True,
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id", ondelete="CASCADE"), index=True)
    excerpt: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    article: Mapped["Article"] = relationship(back_populates="excerpts")
