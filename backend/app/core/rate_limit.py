"""Redis-backed rate limiting with in-memory fallback for local dev."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Literal

import httpx

from app.core.config import settings

RateLimitTier = Literal["anon", "auth", "pro"]

_redis_client = None
_memory_buckets: dict[str, tuple[int, float]] = {}
_pro_cache: dict[str, tuple[bool, float]] = {}
_PRO_CACHE_TTL_SECONDS = 120.0


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    limit: int
    remaining: int
    reset_epoch: int


def _client_ip(forwarded_for: str | None, direct_host: str | None) -> str:
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return direct_host or "unknown"


async def _get_redis():
    global _redis_client
    if not settings.redis_url:
        return None
    if _redis_client is None:
        from redis.asyncio import Redis

        _redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


async def _memory_incr(key: str, window_seconds: int, limit: int) -> RateLimitResult:
    now = time.time()
    window_start = int(now // window_seconds) * window_seconds
    bucket_key = f"{key}:{window_start}"
    count, _ = _memory_buckets.get(bucket_key, (0, window_start))
    count += 1
    _memory_buckets[bucket_key] = (count, window_start)
    if len(_memory_buckets) > 10_000:
        cutoff = now - window_seconds * 2
        for k in list(_memory_buckets.keys()):
            if _memory_buckets[k][1] < cutoff:
                del _memory_buckets[k]

    allowed = count <= limit
    remaining = max(0, limit - count)
    return RateLimitResult(
        allowed=allowed,
        limit=limit,
        remaining=remaining,
        reset_epoch=int(window_start + window_seconds),
    )


async def _redis_incr(key: str, window_seconds: int, limit: int) -> RateLimitResult:
    redis = await _get_redis()
    if redis is None:
        return await _memory_incr(key, window_seconds, limit)

    now = int(time.time())
    window_start = now - (now % window_seconds)
    redis_key = f"rl:{key}:{window_start}"
    async with redis.pipeline(transaction=True) as pipe:
        pipe.incr(redis_key)
        pipe.expire(redis_key, window_seconds + 1)
        results = await pipe.execute()
    count = int(results[0])
    allowed = count <= limit
    remaining = max(0, limit - count)
    return RateLimitResult(
        allowed=allowed,
        limit=limit,
        remaining=remaining,
        reset_epoch=window_start + window_seconds,
    )


def decode_supabase_user_id(authorization: str | None) -> str | None:
    if not authorization or not settings.supabase_jwt_secret:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    if not token:
        return None

    try:
        import jwt
    except ImportError:
        return None

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
    except jwt.PyJWTError:
        return None

    sub = payload.get("sub")
    return str(sub) if sub else None


async def user_has_pro_entitlement(user_id: str) -> bool:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return False

    cached = _pro_cache.get(user_id)
    now = time.time()
    if cached and cached[1] > now:
        return cached[0]

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/subscriptions"
    params = {
        "user_id": f"eq.{user_id}",
        "status": "in.(active,trialing)",
        "select": "current_period_end,status",
        "limit": "1",
    }
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code != 200:
                _pro_cache[user_id] = (False, now + _PRO_CACHE_TTL_SECONDS)
                return False
            rows = response.json()
    except httpx.HTTPError:
        _pro_cache[user_id] = (False, now + 30.0)
        return False

    if not rows:
        _pro_cache[user_id] = (False, now + _PRO_CACHE_TTL_SECONDS)
        return False

    row = rows[0]
    period_end = row.get("current_period_end")
    is_pro = False
    if period_end:
        try:
            from datetime import datetime, timezone

            end = datetime.fromisoformat(str(period_end).replace("Z", "+00:00"))
            is_pro = end > datetime.now(timezone.utc)
        except ValueError:
            is_pro = False
    _pro_cache[user_id] = (is_pro, now + _PRO_CACHE_TTL_SECONDS)
    return is_pro


async def resolve_rate_limit_tier(authorization: str | None) -> tuple[RateLimitTier, str]:
    user_id = decode_supabase_user_id(authorization)
    if not user_id:
        return "anon", "anon"

    if await user_has_pro_entitlement(user_id):
        return "pro", f"user:{user_id}"
    return "auth", f"user:{user_id}"


def limits_for_route(path: str, tier: RateLimitTier) -> tuple[int, int]:
    """Return (limit, window_seconds) for a path and tier."""
    if path.startswith("/api/v1/verify"):
        if tier == "pro":
            return settings.rate_limit_verify_pro_per_hour, 3600
        if tier == "auth":
            return settings.rate_limit_verify_auth_per_hour, 3600
        return settings.rate_limit_verify_anon_per_hour, 3600

    if path.startswith("/api/v1/ingest"):
        return settings.rate_limit_ingest_per_hour, 3600

    if path.startswith("/api/v1/admin"):
        return settings.rate_limit_admin_per_hour, 3600

    return settings.rate_limit_default_per_minute, 60


async def check_rate_limit(
    *,
    path: str,
    tier: RateLimitTier,
    identity_key: str,
    forwarded_for: str | None,
    direct_host: str | None,
) -> RateLimitResult:
    if not settings.rate_limit_enabled:
        return RateLimitResult(allowed=True, limit=0, remaining=0, reset_epoch=0)

    limit, window = limits_for_route(path, tier)
    ip = _client_ip(forwarded_for, direct_host)
    key = f"{path}:{tier}:{identity_key}:{ip}"
    return await _redis_incr(key, window, limit)


async def close_rate_limit_redis() -> None:
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
