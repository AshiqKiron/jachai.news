"""Upload large binaries to object storage (Supabase Storage or future S3) — not the news Postgres DB."""

from __future__ import annotations

import httpx

from app.core.config import settings


class ObjectStorageError(RuntimeError):
    pass


class ObjectStorageNotConfigured(ObjectStorageError):
    pass


def object_storage_enabled() -> bool:
    return settings.object_storage_backend == "supabase" and bool(
        settings.supabase_url and settings.supabase_service_role_key
    )


async def upload_bytes(path: str, data: bytes, content_type: str) -> str:
    """Store bytes at `path` and return a public or CDN URL when configured."""
    if settings.object_storage_backend == "none":
        raise ObjectStorageNotConfigured("Object storage is disabled (OBJECT_STORAGE_BACKEND=none).")
    if settings.object_storage_backend == "supabase":
        return await _upload_supabase(path, data, content_type)
    raise ObjectStorageNotConfigured(f"Unsupported object storage backend: {settings.object_storage_backend}")


async def _upload_supabase(path: str, data: bytes, content_type: str) -> str:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise ObjectStorageNotConfigured("Supabase URL and service role key are required for storage uploads.")

    bucket = settings.object_storage_bucket
    base = settings.supabase_url.rstrip("/")
    url = f"{base}/storage/v1/object/{bucket}/{path.lstrip('/')}"
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, content=data, headers=headers)
        if response.status_code >= 400:
            raise ObjectStorageError(f"Supabase storage upload failed ({response.status_code}): {response.text[:300]}")

    if settings.object_storage_public_base_url:
        return f"{settings.object_storage_public_base_url.rstrip('/')}/{path.lstrip('/')}"
    return f"{base}/storage/v1/object/public/{bucket}/{path.lstrip('/')}"
