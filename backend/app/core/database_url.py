"""Normalize Postgres URLs from Supabase dashboard copies for SQLAlchemy asyncpg."""


def normalize_async_database_url(url: str) -> str:
    """Accept postgresql:// or postgres:// and return postgresql+asyncpg://."""
    cleaned = url.strip()
    if cleaned.startswith("postgresql+asyncpg://"):
        return cleaned
    if cleaned.startswith("postgresql://"):
        return "postgresql+asyncpg://" + cleaned[len("postgresql://") :]
    if cleaned.startswith("postgres://"):
        return "postgresql+asyncpg://" + cleaned[len("postgres://") :]
    return cleaned