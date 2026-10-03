from pathlib import Path
import re

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

_DOLLAR_QUOTE = re.compile(r"\$[A-Za-z0-9_]*\$")


def _split_sql_statements(sql: str) -> list[str]:
    """Split SQL on semicolons outside dollar-quoted blocks (asyncpg = one stmt per execute)."""
    statements: list[str] = []
    current: list[str] = []
    i = 0
    n = len(sql)
    dollar_end: str | None = None

    while i < n:
        if dollar_end is None and sql[i] == "$":
            match = _DOLLAR_QUOTE.match(sql, i)
            if match:
                dollar_end = match.group(0)
                current.append(dollar_end)
                i = match.end()
                continue
        if dollar_end is not None and sql.startswith(dollar_end, i):
            current.append(dollar_end)
            i += len(dollar_end)
            dollar_end = None
            continue
        if dollar_end is None and sql[i] == ";":
            stmt = "".join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
            i += 1
            continue
        current.append(sql[i])
        i += 1

    stmt = "".join(current).strip()
    if stmt:
        statements.append(stmt)
    return statements


async def apply_sql_migrations(engine: AsyncEngine) -> None:
    """Run idempotent SQL migrations (pgvector, FTS) after ORM create_all."""
    migrations_dir = Path(__file__).resolve().parents[2] / "migrations"
    if not migrations_dir.is_dir():
        return
    paths = sorted(migrations_dir.glob("*.sql"))
    async with engine.begin() as conn:
        for migration_path in paths:
            sql = migration_path.read_text(encoding="utf-8")
            for statement in _split_sql_statements(sql):
                await conn.execute(text(statement))
