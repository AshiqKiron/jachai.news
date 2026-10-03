from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.admin import AdminOverviewResponse, AdminSourceCreate, AdminSourceStat
from app.services.admin_stats import get_admin_overview
from app.services.admin_sources import create_admin_source, remove_admin_source

router = APIRouter()


def _require_admin_key(x_admin_key: str | None) -> None:
    if settings.admin_api_key and x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin key")


@router.get("/overview", response_model=AdminOverviewResponse)
async def admin_overview(
    db: AsyncSession = Depends(get_db),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> AdminOverviewResponse:
    _require_admin_key(x_admin_key)
    return await get_admin_overview(db)


@router.post("/sources", response_model=AdminSourceStat, status_code=status.HTTP_201_CREATED)
async def admin_create_source(
    payload: AdminSourceCreate,
    db: AsyncSession = Depends(get_db),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> AdminSourceStat:
    _require_admin_key(x_admin_key)
    return await create_admin_source(db, payload)


@router.delete("/sources/{source_id}", response_model=AdminSourceStat)
async def admin_remove_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> AdminSourceStat:
    _require_admin_key(x_admin_key)
    return await remove_admin_source(db, source_id)
