from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class VerifiedClaim(Base):
    __tablename__ = "verified_claims"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    claim_text: Mapped[str] = mapped_column(Text)
    verdict: Mapped[str] = mapped_column(String(32), default="pending")
    analysis: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    cache_source_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("verified_claims.id", ondelete="SET NULL"), nullable=True
    )
    # Stored via raw SQL / pipeline (pgvector); ORM does not map the vector column.
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
