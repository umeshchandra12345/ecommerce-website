import asyncio
from app.database.session import engine, async_session
from app.tests.example import create_test_data

async def main():
    async with async_session() as session:
        print("Seeding database with test users...")
        try:
            await create_test_data(session)
            print("Successfully seeded test seller and delivery partner!")
        except Exception as e:
            print(f"Error seeding database: {e}")

if __name__ == "__main__":
    asyncio.run(main())
