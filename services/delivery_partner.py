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
        Raises 400 if no eligible partner is found."""
        stmt = (
            select(DeliveryPartner)
            .where(DeliveryPartner.servicable_locations.any(Location.zip_code == destination))
        )
        partners = await self.session.execute(stmt)
        partners = partners.scalars().all()

        if not partners:
            from core.exceptions import DeliveryPartnerNotAvailable
            raise DeliveryPartnerNotAvailable()

        for partner in partners:
            delivered_ids = (
                select(ShipmentEvent.shipment_id)
                .where(ShipmentEvent.status == ShipmentStatus.delivered)
            )
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

        from core.exceptions import DeliveryPartnerCapacityExceeded
        raise DeliveryPartnerCapacityExceeded()
