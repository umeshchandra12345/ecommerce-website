import asyncio
from sqlalchemy import text
from sqlmodel import SQLModel
from app.database.session import engine
from app.database.models import *  # Import all models to populate SQLModel.metadata

async def reset_database():
    print("Resetting database (dropping all tables and recreating)...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)
    print("Database reset complete! All data removed and tables recreated cleanly.")

if __name__ == "__main__":
    asyncio.run(reset_database())
