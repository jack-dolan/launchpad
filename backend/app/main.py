from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.config import settings
from app.database import Base, get_engine
from app.routers import auth, drops

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(drops.router)


@app.on_event("startup")
async def on_startup() -> None:
    """Create database tables on application startup."""
    async with get_engine().begin() as conn:
        if await sqlite_schema_needs_reset(conn):
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


async def sqlite_schema_needs_reset(conn: AsyncConnection) -> bool:
    """Reset stale local SQLite tables when their auth column types are incompatible."""
    if conn.dialect.name != "sqlite" or settings.env == "production":
        return False

    expected_text_columns = {
        "users": {"id"},
        "drops": {"owner_id"},
    }

    for table_name, column_names in expected_text_columns.items():
        result = await conn.execute(text(f"PRAGMA table_info({table_name})"))
        columns = result.mappings().all()
        if not columns:
            continue

        existing_types = {column["name"]: str(column["type"]).upper() for column in columns}
        for column_name in column_names:
            if not is_sqlite_text_affinity(existing_types.get(column_name, "")):
                return True

    return False


def is_sqlite_text_affinity(column_type: str) -> bool:
    """Return whether a SQLite column type has text affinity."""
    return any(token in column_type for token in ("CHAR", "CLOB", "TEXT"))
