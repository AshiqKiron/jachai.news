from app.core.database_url import normalize_async_database_url


def test_normalizes_postgresql_scheme() -> None:
    url = "postgresql://user:pass@host:6543/postgres"
    assert normalize_async_database_url(url) == "postgresql+asyncpg://user:pass@host:6543/postgres"


def test_leaves_asyncpg_unchanged() -> None:
    url = "postgresql+asyncpg://localhost/shorup"
    assert normalize_async_database_url(url) == url