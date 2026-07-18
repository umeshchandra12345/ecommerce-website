from typing import Annotated
from uuid import UUID

from fastapi import BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from app.database.models import DeliveryPartner, Seller
from app.database.redis import is_jti_blacklisted
from core.security import oauth2_scheme_seller, oauth2_scheme_partner
from app.database.session import SessionDep
from services.seller import SellerService
from services.shipment import ShipmentService
from services.shipment_event import ShipmentEventService
from utils import decode_access_token
from services.delivery_partner import DeliveryPartnerService
from services.tag import TagService

from core.exceptions import InvalidToken, ClientNotAuthorized

# Access token data dependency
def _unauthorized(detail: str = "Invalid or expired access token"):
    if detail == "Not Authorized":
        raise ClientNotAuthorized()
    raise InvalidToken()


def _get_user_id(token_data: dict) -> str | None:
    user = token_data.get("user")
    if not isinstance(user, dict):
        return None
    user_id = user.get("id")
    return str(user_id) if user_id else None


async def _get_access_token(token: str) -> dict:
    data = decode_access_token(token)
    jti = data.get("jti") if data else None
    if data is None or jti is None or await is_jti_blacklisted(jti):
        _unauthorized()

    return data


async def get_seller_access_token(
    token: Annotated[str, Depends(oauth2_scheme_seller)],
) -> dict:
    return await _get_access_token(token)


async def get_partner_access_token(
    token: Annotated[str, Depends(oauth2_scheme_partner)],
) -> dict:
    return await _get_access_token(token)


# Logged in seller
async def get_current_seller(
    token_data: Annotated[dict, Depends(get_seller_access_token)],
    session: SessionDep,
):
    user_id = _get_user_id(token_data)
    seller = None
    if user_id:
        try:
            seller = await session.get(Seller, UUID(user_id))
        except ValueError:
            pass

    if seller is None and token_data.get("sub"):
        seller = await session.scalar(
            select(Seller).where(Seller.email == token_data["sub"])
        )

    if seller is None:
        _unauthorized("Not Authorized")

    return seller


# Logged in delivery partner
async def get_current_partner(
    token_data: Annotated[dict, Depends(get_partner_access_token)],
    session: SessionDep,
):
    user_id = _get_user_id(token_data)
    partner = None
    if user_id:
        try:
            partner = await session.get(DeliveryPartner, UUID(user_id))
        except ValueError:
            pass

    if partner is None and token_data.get("sub"):
        partner = await session.scalar(
            select(DeliveryPartner).where(DeliveryPartner.email == token_data["sub"])
        )

    if partner is None:
        _unauthorized("Not Authorized")

    return partner

#shipment service dep
def get_shipment_service(
    session: SessionDep):
    return ShipmentService(
        session,
        DeliveryPartnerService(session),
        ShipmentEventService(session),
        )

#seller service dep
def get_seller_service(session: SessionDep):
    return SellerService(session)

#delivery partner service dep
def get_delivery_partner_service(session:SessionDep,tasks: BackgroundTasks):
    return DeliveryPartnerService(session,tasks)

#seller dep 
SellerDep=Annotated[
    Seller,
    Depends(get_current_seller),
]

#delivery partner dep
DeliveryPartnerDep=Annotated[
    DeliveryPartner,
    Depends(get_current_partner),
]

#shipment service dep annotation
ShipmentServiceDep = Annotated[ShipmentService, Depends(get_shipment_service)]

#seller service dep annotation
SellerServiceDep = Annotated[SellerService, Depends(get_seller_service)]

DeliveryPartnerServiceDep=Annotated[
    DeliveryPartnerService,
    Depends(get_delivery_partner_service),
    ]

def get_tag_service(session: SessionDep):
    return TagService(session)

TagServiceDep = Annotated[TagService, Depends(get_tag_service)]
