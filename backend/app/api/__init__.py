from fastapi import APIRouter

from app.api import articles, bias, clusters, rumors

api_router = APIRouter()
api_router.include_router(articles.router, prefix="/articles", tags=["articles"])
api_router.include_router(clusters.router, prefix="/clusters", tags=["clusters"])
api_router.include_router(bias.router, prefix="/bias", tags=["bias"])
api_router.include_router(rumors.router, prefix="/rumors", tags=["rumors"])
