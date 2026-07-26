import asyncio
from app.database.session import async_session
from app.database.models import Seller, DeliveryPartner, Location
from services.user import password_context

async def seed():
    async with async_session() as session:
        print("Seeding fresh initial accounts...")
        seller = Seller(
            name="Umesh Seller",
            email="umeshonline@gmail.com",
            email_verified=True,
            password_hash=password_context.hash("umesh5566."),
            address="123 Main St",
            zip_code=110001
        )

        partner = DeliveryPartner(
            name="Umesh Partner",
            email="umesh10@gmail.com",
            email_verified=True,
            password_hash=password_context.hash("umesh5566."),
            max_handling_capacity=20
        )

        location = Location(zip_code=110001)
        partner.servicable_locations.append(location)

        session.add(seller)
        session.add(partner)
        session.add(location)

        await session.commit()
        print("Seeded demo seller (umeshonline@gmail.com) and partner (umesh10@gmail.com) with password umesh5566.")

if __name__ == "__main__":
    asyncio.run(seed())
