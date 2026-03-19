from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    pass


@lru_cache
def get_engine() -> AsyncEngine:
    """Return the shared async database engine for the current process."""
    return create_async_engine(settings.database_url, echo=False)


@lru_cache
def get_session_maker() -> async_sessionmaker[AsyncSession]:
    """Return the cached async session factory bound to the shared engine."""
    return async_sessionmaker(bind=get_engine(), class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session for a single request."""
    session_maker = get_session_maker()
    async with session_maker() as session:
        yield session
