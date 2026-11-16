import ssl
from collections.abc import AsyncGenerator

import certifi
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings


def _supabase_ssl_context() -> ssl.SSLContext | bool:
    if settings.database_ssl_insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    return ssl.create_default_context(cafile=certifi.where())


def _create_engine():
    url = settings.resolved_database_url
    if settings.database_pool_mode == "pgbouncer":
        return create_async_engine(
            url,
            echo=False,
            poolclass=NullPool,
            connect_args={
                "statement_cache_size": 0,
                "ssl": _supabase_ssl_context(),
            },
        )
    return create_async_engine(
        url,
        echo=False,
        pool_pre_ping=True,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_recycle=settings.database_pool_recycle_seconds,
    )


engine = _create_engine()
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
