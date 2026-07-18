from fastapi import APIRouter

from .routers.seller import router as seller_router
from .routers.shipment import router as shipment_router
from .routers.delivery_partner import router as partner_router

master_router = APIRouter()
master_router.include_router(seller_router)
master_router.include_router(shipment_router)
master_router.include_router(partner_router)
