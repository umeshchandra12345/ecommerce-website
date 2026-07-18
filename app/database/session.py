from typing import Annotated
import logging


from fastapi import Depends
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlmodel import SQLModel

from app.config import settings

# Build database URL from settings
url = settings.DATABASE_URI


# Create engine
# Use connect_args={"check_same_thread": False} for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in url else {}

engine = create_async_engine(
    url,
    echo=True,
    connect_args=connect_args,
)

# Session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

from .models import Shipment, Seller  # noqa: E402


async def create_db_tables():
    import traceback
    try:
        async with engine.begin() as connection:
            from app.database.models import Shipment , Seller
            await connection.run_sync(SQLModel.metadata.create_all)
    except Exception:
        print("\n===== FULL DB ERROR =====")
        traceback.print_exc()
        print("===== END DB ERROR =====\n")


async def get_session():
    async with async_session() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]
