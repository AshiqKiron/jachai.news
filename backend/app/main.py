from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.rate_limit import close_rate_limit_redis
from app.core.sentry_init import init_sentry
from app.services.db_extensions import apply_sql_migrations
from app.middleware.rate_limit_middleware import RateLimitMiddleware

init_sentry()


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await apply_sql_migrations(engine)
    yield
    await close_rate_limit_redis()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
