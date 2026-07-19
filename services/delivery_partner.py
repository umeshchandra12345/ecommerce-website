from typing import Sequence

from fastapi import HTTPException, status

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


from api.schemas.delivery_partner import DeliveryPartnerCreate, DeliveryPartnerUpdate
from app.database.models import DeliveryPartner, Location, Shipment, ShipmentEvent, ShipmentStatus
from services.user import UserService

class DeliveryPartnerService(UserService):
    def __init__(self, session: AsyncSession, tasks=None):
        super().__init__(DeliveryPartner, session)

    async def add(self, partner_create: DeliveryPartnerCreate) -> DeliveryPartner:
        partner: DeliveryPartner = await self._add_user(
            partner_create.model_dump(exclude={"serviceable_zip_codes"}),
            "partner",
        )
        
        for zip_code in partner_create.serviceable_zip_codes:
            location = await self.session.get(Location, zip_code)
            partner.servicable_locations.append(
                location
                if location
                else Location(zip_code=zip_code)
            )
            
        return await self._update(partner)
    
    async def get_partner_by_zipcode(self,zipcode:int) ->Sequence[DeliveryPartner]:
        result = await self.session.scalars(
            select(DeliveryPartner)
            .join(DeliveryPartner.servicable_locations)
            .where(Location.zip_code == zipcode)
        )
        return result.all()
            
    async def token(self, email: str, password: str) -> str:
        return await self._generate_token(email, password)

    async def update(self, partner: DeliveryPartner) -> DeliveryPartner:
        return await self._update(partner)

    async def assign_shipment(self, destination: int) -> DeliveryPartner:
        """Find a delivery partner that can service the destination zip code
        and has available capacity (active shipments < max_handling_capacity).
        Falls back to any active partner or creates a default system partner if none exist."""
        delivered_ids = (
            select(ShipmentEvent.shipment_id)
            .where(ShipmentEvent.status == ShipmentStatus.delivered)
        )
        
        # 1. Try to find a partner explicitly servicing this destination zip code
        stmt = (
            select(DeliveryPartner)
            .where(DeliveryPartner.servicable_locations.any(Location.zip_code == destination))
        )
        partners = (await self.session.execute(stmt)).scalars().all()

        for partner in partners:
            active_count_stmt = (
                select(func.count(Shipment.id))
                .where(
                    Shipment.delivery_partner_id == partner.id,
                    Shipment.id.not_in(delivered_ids),
                )
            )
            active_count = await self.session.scalar(active_count_stmt)
            if active_count < partner.max_handling_capacity:
                return partner

        # 2. Fallback: Assign to any registered delivery partner with capacity
        all_partners = (await self.session.execute(select(DeliveryPartner))).scalars().all()
        for partner in all_partners:
            active_count_stmt = (
                select(func.count(Shipment.id))
                .where(
                    Shipment.delivery_partner_id == partner.id,
                    Shipment.id.not_in(delivered_ids),
                )
            )
            active_count = await self.session.scalar(active_count_stmt)
            if active_count < partner.max_handling_capacity:
                loc = await self.session.get(Location, destination)
                if not loc:
                    loc = Location(zip_code=destination)
                partner.servicable_locations.append(loc)
                await self.session.commit()
                return partner

        # 3. Fallback: Auto-create a default system partner if no delivery partners exist yet
        from services.user import password_context
        default_partner = DeliveryPartner(
            name="FastShip Express",
            email="express@fastship.com",
            email_verified=True,
            password_hash=password_context.hash("FastShip123!"),
            max_handling_capacity=100,
        )
        loc = await self.session.get(Location, destination)
        if not loc:
            loc = Location(zip_code=destination)
        default_partner.servicable_locations.append(loc)
        self.session.add(default_partner)
        await self.session.commit()
        await self.session.refresh(default_partner)
        return default_partner
