from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ClusterEvent(Base):
    __tablename__ = "cluster_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_type: Mapped[str] = mapped_column(String(32))
    keeper_cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id", ondelete="CASCADE"), index=True)
    other_cluster_id: Mapped[int | None] = mapped_column(
        ForeignKey("clusters.id", ondelete="SET NULL"),
        nullable=True,
    )
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
