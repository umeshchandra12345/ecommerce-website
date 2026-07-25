import logging
from fastapi import APIRouter, HTTPException
from sqlalchemy import delete, select
from app.database.session import SessionDep
from app.database.models import Seller, DeliveryPartner, Shipment, ShipmentEvent, ShipmentTag, Review, ServicableLocation

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/clear-user")
async def clear_user_endpoint(email: str, session: SessionDep):
    """Delete any Seller or DeliveryPartner records matching the email along with dependent shipments."""
    try:
        target_partners = (await session.execute(select(DeliveryPartner.id).where(DeliveryPartner.email == email))).scalars().all()
        target_sellers = (await session.execute(select(Seller.id).where(Seller.email == email))).scalars().all()
        
        conditions = []
        if target_partners:
            conditions.append(Shipment.delivery_partner_id.in_(target_partners))
        if target_sellers:
            conditions.append(Shipment.seller_id.in_(target_sellers))
        
        if conditions:
            from sqlalchemy import or_
            shipment_ids = (await session.execute(select(Shipment.id).where(or_(*conditions)))).scalars().all()
            if shipment_ids:
                await session.execute(delete(ShipmentEvent).where(ShipmentEvent.shipment_id.in_(shipment_ids)))
                await session.execute(delete(ShipmentTag).where(ShipmentTag.shipment_id.in_(shipment_ids)))
                await session.execute(delete(Review).where(Review.shipment_id.in_(shipment_ids)))
                await session.execute(delete(Shipment).where(Shipment.id.in_(shipment_ids)))

        if target_partners:
            await session.execute(delete(ServicableLocation).where(ServicableLocation.partner_id.in_(target_partners)))
            await session.execute(delete(DeliveryPartner).where(DeliveryPartner.email == email))

        if target_sellers:
            await session.execute(delete(Seller).where(Seller.email == email))

        await session.commit()
        return {"detail": f"Successfully deleted data for email: {email}"}
    except Exception as exc:
        logging.exception("Failed to clear user data")
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/clear-all")
async def clear_all_endpoint(session: SessionDep):
    """Delete all sellers, delivery partners, and shipment records from the database."""
    try:
        await session.execute(delete(ShipmentEvent))
        await session.execute(delete(ShipmentTag))
        await session.execute(delete(Review))
        await session.execute(delete(ServicableLocation))
        await session.execute(delete(Shipment))
        await session.execute(delete(DeliveryPartner))
        await session.execute(delete(Seller))
        await session.commit()
        return {"detail": "All database records cleared successfully."}
    except Exception as exc:
        logging.exception("Failed to clear all database data")
        raise HTTPException(status_code=500, detail=str(exc))
