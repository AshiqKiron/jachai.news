from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import settings
from app.core.rate_limit import check_rate_limit, resolve_rate_limit_tier


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        if not path.startswith(settings.api_v1_prefix):
            return await call_next(request)

        if path in (f"{settings.api_v1_prefix}/openapi.json",):
            return await call_next(request)

        tier, identity = await resolve_rate_limit_tier(request.headers.get("Authorization"))
        if tier == "anon":
            identity = "anon"

        # Valid ingest/admin keys get a dedicated bucket with higher trust (still limited)
        ingest_key = request.headers.get("X-Ingest-Key")
        if path.startswith(f"{settings.api_v1_prefix}/ingest") and settings.ingest_api_key:
            if ingest_key == settings.ingest_api_key:
                identity = "ingest-key"

        admin_key = request.headers.get("X-Admin-Key")
        if path.startswith(f"{settings.api_v1_prefix}/admin") and settings.admin_api_key:
            if admin_key == settings.admin_api_key:
                identity = "admin-key"

        result = await check_rate_limit(
            path=path,
            tier=tier,
            identity_key=identity,
            forwarded_for=request.headers.get("X-Forwarded-For"),
            direct_host=request.client.host if request.client else None,
        )

        if not result.allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again later."},
                headers={
                    "Retry-After": str(max(1, result.reset_epoch - int(__import__("time").time()))),
                    "X-RateLimit-Limit": str(result.limit),
                    "X-RateLimit-Remaining": str(result.remaining),
                    "X-RateLimit-Reset": str(result.reset_epoch),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(result.limit)
        response.headers["X-RateLimit-Remaining"] = str(result.remaining)
        response.headers["X-RateLimit-Reset"] = str(result.reset_epoch)
        return response
