from collections.abc import AsyncGenerator
from functools import lru_cache
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


@lru_cache
def get_engine():
    database_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./launchpad.db")
    return create_async_engine(database_url, echo=False)


@lru_cache
def get_session_maker():
    return async_sessionmaker(bind=get_engine(), class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session_maker = get_session_maker()
    async with session_maker() as session:
        yield session
