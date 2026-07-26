import asyncio
from sqlmodel import SQLModel
from app.database.session import engine
from app.database.models import *  # Import all models to populate SQLModel.metadata

async def reset_database():
    print("Clearing database completely (0 users, 0 sellers, 0 partners, 0 shipments)...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)
    print("Database completely cleared! 100% fresh empty database.")

if __name__ == "__main__":
    asyncio.run(reset_database())
