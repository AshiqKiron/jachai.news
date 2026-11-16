"""Normalize Postgres URLs from Supabase dashboard copies for SQLAlchemy asyncpg."""

from urllib.parse import urlsplit, urlunsplit


def normalize_async_database_url(url: str) -> str:
    """Accept postgresql:// or postgres:// and return postgresql+asyncpg://."""
    cleaned = url.strip()
    # asyncpg does not accept libpq-style sslmode query params on the URL.
    parts = urlsplit(cleaned)
    if parts.query:
        cleaned = urlunsplit((parts.scheme, parts.netloc, parts.path, "", parts.fragment))
    if cleaned.startswith("postgresql+asyncpg://"):
        return cleaned
    if cleaned.startswith("postgresql://"):
        return "postgresql+asyncpg://" + cleaned[len("postgresql://") :]
    if cleaned.startswith("postgres://"):
        return "postgresql+asyncpg://" + cleaned[len("postgres://") :]
    return cleaned