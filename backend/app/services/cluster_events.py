from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cluster_event import ClusterEvent


async def log_cluster_merge(
    session: AsyncSession,
    *,
    keeper_cluster_id: int,
    other_cluster_id: int,
    payload: dict[str, Any] | None = None,
) -> None:
    session.add(
        ClusterEvent(
            event_type="merge",
            keeper_cluster_id=keeper_cluster_id,
            other_cluster_id=other_cluster_id,
            payload=payload or {},
        )
    )
