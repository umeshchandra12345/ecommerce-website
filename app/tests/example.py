from services.user import password_context
from app.database.models import Seller, DeliveryPartner, Location

SELLER = {
    "name": "Test Seller",
    "email": "seller@example.com",
    "password": "password123",
    "address": "123 Seller St",
    "zip_code": 110001,
}

DELIVERY_PARTNER = {
    "name": "Test Partner",
    "email": "partner@example.com",
    "password": "password123",
    "max_handling_capacity": 5,
}

SHIPMENT = {
    "content": "Sample Shipment Item",
    "weight": 12.5,
    "destination": 110001,
    "client_contact_email": "client@example.com",
    "client_contact_phone": "1234567890",
}

async def create_test_data(session):
    # Create seller with email verified
    seller = Seller(
        name=SELLER["name"],
        email=SELLER["email"],
        email_verified=True,
        password_hash=password_context.hash(SELLER["password"]),
        address=SELLER["address"],
        zip_code=SELLER["zip_code"],
    )

    # Create delivery partner with email verified
    partner = DeliveryPartner(
        name=DELIVERY_PARTNER["name"],
        email=DELIVERY_PARTNER["email"],
        email_verified=True,
        password_hash=password_context.hash(DELIVERY_PARTNER["password"]),
        max_handling_capacity=DELIVERY_PARTNER["max_handling_capacity"],
    )

    # Create location and associate it
    location = Location(zip_code=110001)
    partner.servicable_locations.append(location)

    # Add to session
    session.add(seller)
    session.add(partner)
    session.add(location)

    # Commit the changes
    await session.commit()
