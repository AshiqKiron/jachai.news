from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ArticleTitle(Base):
    """One published wording of an article headline.

    The article row keeps the current title. This table keeps every distinct
    wording, including later rewrites, so search, trends, and other features
    can read headlines without guessing from the live row.
    """

    __tablename__ = "article_titles"
    __table_args__ = (
        CheckConstraint(
            "language IN ('bn', 'en', 'mixed', 'unknown')",
            name="article_titles_language_chk",
        ),
        Index(
            "article_titles_article_id_title_md5_uidx",
            "article_id",
            text("md5(title)"),
            unique=True,
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(8))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    article: Mapped["Article"] = relationship(back_populates="titles")
