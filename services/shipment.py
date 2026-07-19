from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException,status

from api.schemas.shipment import ShipmentCreate, ShipmentReview, ShipmentUpdate
from app.database.models import DeliveryPartner, Review, Seller, Shipment, ShipmentStatus, TagName
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.redis import get_shipment_verification_code
from core.exceptions import ClientNotAuthorized, EntityNotFound, InvalidToken
from services.shipment_event import ShipmentEventService
from utils import decode_url_safe_token
from .base import BaseService
from .delivery_partner import DeliveryPartnerService

class ShipmentService(BaseService):
    def __init__(self,
                session: AsyncSession,
                partner_service: DeliveryPartnerService,
                event_service:ShipmentEventService):
        super().__init__(Shipment, session)
        self.partner_service = partner_service
        self.event_service=event_service
        
    #get a shipment id
    async def get(self, id: UUID) -> Shipment | None:
        shipment = await self._get(id)
        if not shipment:
            raise EntityNotFound
        return shipment 
        
    #add a new shipment
    async def add(self, shipment_create: ShipmentCreate, seller: Seller) -> Shipment:
        shipment = Shipment(
            **shipment_create.model_dump(),
            estimated_delivery=datetime.now(timezone.utc) + timedelta(days=3),
            seller_id=seller.id,
        )
        partner = await self.partner_service.assign_shipment(shipment.destination)
        shipment.delivery_partner_id = partner.id
        
        shipment = await self._add(shipment)
        
        event=await self.event_service.add(
            shipment=shipment,
            location=seller.zip_code,
            status=ShipmentStatus.placed,
            description=f"assigned to {partner.name}"
        )
        
        shipment.timeline.append(event)
        
        return shipment 
        

    async def update(self,id:UUID, shipment_update: ShipmentUpdate,partner:DeliveryPartner) -> Shipment:
        shipment = await self.get(id)
        if shipment is None:
            raise EntityNotFound()

        if shipment.delivery_partner_id != partner.id:
            shipment.delivery_partner_id = partner.id
        
        
        
        if shipment_update.status == ShipmentStatus.delivered:
            code = await get_shipment_verification_code(shipment.id)
            
            if code!=shipment_update.verification_code:
                raise ClientNotAuthorized()
                
        update = shipment_update.model_dump(exclude_none=True,exclude=["verification_code"],)
            
        # Flag to check if a shipment event needs to be created
        create_event = False
        event_data = {}

        if shipment_update.status is not None:
            event_data["status"] = shipment_update.status
            create_event = True
        
        if shipment_update.location is not None:
            # Based on the models, Shipment does not have a 'location' field, it is part of ShipmentEvent.
            event_data["location"] = shipment_update.location
            create_event = True

        if shipment_update.description is not None:
            # Based on the models, Shipment does not have a 'description' field, it is part of ShipmentEvent.
            event_data["description"] = shipment_update.description
            create_event = True
            
        if shipment_update.estimated_delivery is not None:
            shipment.estimated_delivery = shipment_update.estimated_delivery
            # If only estimated_delivery is updated, create_event remains False
            # If other fields were updated, create_event is already True
            
        

        if create_event:
            await self.event_service.add(
                shipment=shipment,
                **event_data,
            )
        
        return await self._update(shipment)
    
    async def add_tag(self, id: UUID, tag_name: TagName):
        shipment = await self.get(id)
        shipment.tags.append(await tag_name.tag(self.session))
        return await self._update(shipment)
        
    async def remove_tag(self, id: UUID, tag_name: TagName):
        shipment = await self.get(id)
        try:
            shipment.tags.remove(await tag_name.tag(self.session))
        except ValueError:
            raise EntityNotFound()
        
        return await self._update(shipment)
    
    
    async def rate(self,token:str , review:ShipmentReview):
        token_data= decode_url_safe_token(token)
        if not token_data:
            raise InvalidToken()
        shipment=await self.get(UUID(token_data["id"]))
        
        new_review = Review(
            rating=review.rating,
            comment=review.comment if review.comment else None,
            shipment_id=shipment.id,
        )
        
        self.session.add(new_review)
        await self.session.commit()
    
    async def cancel(self,id:UUID,seller:Seller)->Shipment:
        shipment=await self.get(id)
        if shipment is None:
            raise EntityNotFound()
        
        if shipment.seller_id!=seller.id:
            raise ClientNotAuthorized()
            
        event=await self.event_service.add(
            shipment=shipment,
            status=ShipmentStatus.cancelled,
        )
        
        shipment.timeline.append(event)
        return await self._update(shipment)
    async def delete(self, id: UUID) -> None:
        shipment = await self.get(id)
        if shipment:
            await self._delete(shipment)
            
            
