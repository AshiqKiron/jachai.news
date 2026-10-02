from fastapi import APIRouter

from app.api import admin, articles, bias, clusters, ingest, rumors

api_router = APIRouter()
api_router.include_router(articles.router, prefix="/articles", tags=["articles"])
api_router.include_router(clusters.router, prefix="/clusters", tags=["clusters"])
api_router.include_router(bias.router, prefix="/bias", tags=["bias"])
api_router.include_router(rumors.router, prefix="/rumors", tags=["rumors"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
