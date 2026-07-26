import os
from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from random import randint

from app.database.models import Shipment, ShipmentEvent, ShipmentStatus
from app.database.redis import add_shipment_verification_code
from app.worker.tasks import send_sms, send_email_with_template, send_email_with_template_async
from services.base import BaseService
from utils import generate_url_safe_token
from app.config import app_settings

class ShipmentEventService(BaseService):
    def __init__(self, session):
        super().__init__(ShipmentEvent, session)        
    async def add(
        self,
        shipment:Shipment,
        location:int=None,
        status:ShipmentStatus=None,
        description:str=None,
    )->ShipmentEvent:
        last_event = await self.get_latest_event(shipment)
        
        if not location:
            location = last_event.location if last_event else (shipment.destination or 0)
        if not status:
            status = last_event.status if last_event else ShipmentStatus.placed
        
        new_event=ShipmentEvent(
            location=location,
            status=status,
            description=description
            if description
            else self._generate_description(
                status,
                location,
                ),
            shipment_id=shipment.id,
        )
        
        await self._notify(shipment,status)
        
        return await self._add(new_event)
    async def get_latest_event(self,shipment:Shipment):
        timeline=shipment.timeline
        if not timeline:
            return None
        timeline.sort(key=lambda event: event.created_at)
        return timeline[-1]
    
    def _generate_description(self,status:ShipmentStatus,location:int):
        match status:
            case ShipmentStatus.placed:
                return "assigned delivery partner"
            case ShipmentStatus.out_for_delivery:
                return "shipment out_for_delivery"
            case ShipmentStatus.delivered:
                return "successfully delivered"
            case ShipmentStatus.cancelled:
                return "Cancelled by seller"
            case _: #shipment in transit
                return f"Scanned at {location}"
                
    async def _notify(self, shipment: Shipment, status: ShipmentStatus):
        if status == ShipmentStatus.in_transit:
            return

        subject = ""
        template_name = None
        seller_name = shipment.seller.name if getattr(shipment, "seller", None) else "FastShip Seller"
        partner_name = shipment.delivery_partner.name if getattr(shipment, "delivery_partner", None) else "our delivery partner"

        context = {
            "id": str(shipment.id),
            "seller": seller_name,
            "partner": partner_name,
            "content": shipment.content,
            "destination": shipment.destination,
            "estimated_delivery": shipment.estimated_delivery.strftime("%B %d, %Y") if shipment.estimated_delivery else "TBD",
            "app_domain": app_settings.APP_DOMAIN,
        }

        match status:
            case ShipmentStatus.placed:
                subject = "Your Order is Shipped 🚚"
                context["id"]=str(shipment.id)
                context["seller"]=seller_name
                context["partner"]=partner_name
                template_name = "mail_placed.html"

            case ShipmentStatus.out_for_delivery:
                subject = "Your Order is Arriving soon🚚"
                template_name = "mail_out_for_delivery.html"
                
                from services.otp import OTPService
                otp_service = OTPService(self.session)
                code = await otp_service.generate_and_send_otp(shipment, ttl_minutes=10)
                context["verification_code"] = code
            case ShipmentStatus.delivered:
                subject = "Your Order is Delivered✅"
                token = generate_url_safe_token({"id": str(shipment.id)})
                protocol = "https" if (os.getenv("VERCEL") == "1" or "vercel" in app_settings.APP_DOMAIN) else "http"
                context["review_url"] = f"{protocol}://{app_settings.APP_DOMAIN}/shipment/review?id={shipment.id}&token={token}"
                template_name = "mail_delivered.html"

            case ShipmentStatus.cancelled:
                subject = "Your Order is Cancelled"
                template_name = "mail_cancelled.html"

        if not template_name:
            return

        try:
            if os.getenv("VERCEL") == "1":
                await send_email_with_template_async(
                    recipients=[shipment.client_contact_email],
                    subject=subject,
                    context=context,
                    template_name=template_name,
                )
            else:
                send_email_with_template.delay(
                    recipients=[shipment.client_contact_email],
                    subject=subject,
                    context=context,
                    template_name=template_name,
                )
        except Exception:
            pass  # Celery/Redis unavailable on Vercel
