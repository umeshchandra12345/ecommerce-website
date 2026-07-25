from typing import Annotated, Any, Optional
from pydantic import EmailStr
from api.tags import APITag
from app.database.models import DeliveryPartner, Seller, Shipment
from app.database.redis import add_jti_to_blacklist
from fastapi import APIRouter, Depends, HTTPException, status, Request, Form, Query, Response
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import logging
from fastapi.security import OAuth2PasswordRequestForm

from utils import decode_access_token, TEMPLATE_DIR
from app.config import app_settings

templates = Jinja2Templates(directory=str(TEMPLATE_DIR))

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..dependencies import DeliveryPartnerDep, DeliveryPartnerServiceDep, SessionDep, get_partner_access_token, get_current_partner
from ..schemas.delivery_partner import DeliveryPartnerCreate, DeliveryPartnerRead, DeliveryPartnerUpdate, TokenResponse
from ..schemas.shipment import ShipmentRead
from services.seller import SellerService
from core.exceptions import NothingToUpdate, FastShipError
from app.database.models import Shipment

router = APIRouter(prefix="/partner", tags=[APITag.PARTNER])

##register a delivery partner
@router.post("/signup", response_model=DeliveryPartnerRead)
async def register_delivery_partner(
    seller: DeliveryPartnerCreate,
    service: DeliveryPartnerServiceDep,
):
    logging.info(f"Signup request payload: {seller}")
    try:
        return await service.add(seller)
    except (HTTPException, FastShipError):
        # Propagate HTTPExceptions and FastShipError custom exceptions
        raise
    except Exception as exc:
        logging.exception("Delivery partner signup failed")
        raise HTTPException(status_code=400, detail="Signup failed. Please check your input and try again.")

@router.get("/shipments")
async def get_shipments(
    response: Response,
    partner: Annotated[DeliveryPartner, Depends(get_current_partner)],
    session: SessionDep,
    status: Annotated[Optional[str], Query()] = None,
    search: Annotated[Optional[str], Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    stmt = select(Shipment).where(Shipment.delivery_partner_id == partner.id)

    if status:
        from app.database.models import ShipmentEvent
        subq = (
            select(ShipmentEvent.shipment_id, func.max(ShipmentEvent.created_at).label("max_created"))
            .group_by(ShipmentEvent.shipment_id)
            .subquery()
        )
        latest_event = (
            select(ShipmentEvent.shipment_id)
            .join(subq, (ShipmentEvent.shipment_id == subq.c.shipment_id) & (ShipmentEvent.created_at == subq.c.max_created))
            .where(ShipmentEvent.status == status)
        )
        stmt = stmt.where(Shipment.id.in_(latest_event))
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            (Shipment.content.ilike(search_pattern)) |
            (Shipment.client_contact_email.ilike(search_pattern))
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar() or 0

    stmt = (
        stmt.order_by(Shipment.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .options(selectinload(Shipment.timeline), selectinload(Shipment.tags))
    )
    result = await session.scalars(stmt)
    items = result.all()

    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    response.headers["X-Total-Count"] = str(total)
    response.headers["X-Page"] = str(page)
    response.headers["X-Limit"] = str(limit)
    response.headers["X-Total-Pages"] = str(total_pages)

    from api.schemas.shipment import ShipmentRead
    return {
        "items": [ShipmentRead.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }

@router.get("/me", response_model=DeliveryPartnerRead)
async def get_partner_profile(
    partner: Annotated[DeliveryPartner, Depends(get_current_partner)],
):
    return partner

###login delivery partner
@router.post("/token")
async def login_delivery_partner(
    request_form: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: DeliveryPartnerServiceDep,
):
    token = await service.token(request_form.username,request_form.password)
    return {
        "access_token":token,
        "type":"jwt",
    }
    
    
###Verify Delivery Partner Email 
@router.get("/verify")
async def verify_delivery_partner_email(token:str,service:DeliveryPartnerServiceDep):
    await service.verify_email(token)
    return {"detail":"Account Verified"}
    
## update the delivery partner
@router.post("/")
async def update_delivery_partner(
    partner_update:DeliveryPartnerUpdate,
    partner:DeliveryPartnerDep,
    service: DeliveryPartnerServiceDep,
):
    # Update data with given fields
    update = partner_update.model_dump(exclude_none=True)

    if not update:
        raise NothingToUpdate()
    return await service.update_partner(partner, partner_update)
    

###logout the delivery partner 
@router.get("/logout")
async def logout_delivery_partner(token_data:Annotated[dict,Depends(get_partner_access_token)],
):
    await add_jti_to_blacklist(token_data["jti"])
    return {
        "detail":"Successfully logged out"
    }

###Email Password reset link
@router.get("/forgot_password")
async def forgot_password(request: Request, email:EmailStr,service:DeliveryPartnerServiceDep):
    proto = request.headers.get("x-forwarded-proto", "http")
    host = request.headers.get("x-forwarded-host") or request.headers.get("host", "localhost:8000")
    base_url = f"{proto}://{host}"
    await service.send_password_reset_link(email,router.prefix, base_url)
    return {"detail":"Check email for password reset link"}

###Reset partner password
@router.get("/reset_password_form", response_class=HTMLResponse)
async def reset_password_page(request: Request, token: str):
    reset_url = f"/api{router.prefix}/reset_password?token={token}"
    return templates.TemplateResponse(
        request=request,
        name="reset_password.html",
        context={"reset_url": reset_url}
    )

###Reset partner password
@router.post("/reset_password", response_class=HTMLResponse)
async def reset_password_submit(
    request: Request,
    token: str,
    service: DeliveryPartnerServiceDep,
    password: str = Form(...)
):
    try:
        is_success = await service.reset_password(token, password)
    except Exception:
        is_success = False
        
    return templates.TemplateResponse(
        request=request,
        name="reset_success.html" if is_success else "reset_failed.html"
    )

@router.get("/inspect-db")
async def inspect_db(session: SessionDep):
    try:
        partners = (await session.execute(select(DeliveryPartner))).scalars().all()
        sellers = (await session.execute(select(Seller))).scalars().all()
        shipments = (await session.execute(select(Shipment))).scalars().all()
        return {
            "partners": [{"id": str(p.id), "name": p.name, "email": p.email, "email_verified": p.email_verified} for p in partners],
            "sellers": [{"id": str(s.id), "name": s.name, "email": s.email, "email_verified": s.email_verified} for s in sellers],
            "shipments": [{"id": str(sh.id), "content": sh.content, "delivery_partner_id": str(sh.delivery_partner_id) if sh.delivery_partner_id else None} for sh in shipments]
        }
    except Exception as e:
        logging.exception("Failed to inspect DB")
        raise HTTPException(status_code=500, detail="Internal server error while inspecting DB")

@router.get("/clear-user")
async def clear_user_data(email: str, session: SessionDep):
    try:
        from app.database.models import ShipmentEvent, ShipmentTag, Review, ServicableLocation
        
        # Get target seller IDs and partner IDs
        target_partners = (await session.execute(select(DeliveryPartner.id).where(DeliveryPartner.email == email))).scalars().all()
        target_sellers = (await session.execute(select(Seller.id).where(Seller.email == email))).scalars().all()
        
        conditions = []
        if target_partners:
            conditions.append(Shipment.delivery_partner_id.in_(target_partners))
        if target_sellers:
            conditions.append(Shipment.seller_id.in_(target_sellers))
        
        target_shipment_ids = []
        if conditions:
            from sqlalchemy import or_
            shipment_stmt = select(Shipment.id).where(or_(*conditions))
            target_shipment_ids = (await session.execute(shipment_stmt)).scalars().all()

        if target_shipment_ids:
            await session.execute(delete(ShipmentEvent).where(ShipmentEvent.shipment_id.in_(target_shipment_ids)))
            await session.execute(delete(ShipmentTag).where(ShipmentTag.shipment_id.in_(target_shipment_ids)))
            await session.execute(delete(Review).where(Review.shipment_id.in_(target_shipment_ids)))
            await session.execute(delete(Shipment).where(Shipment.id.in_(target_shipment_ids)))

        if target_partners:
            await session.execute(delete(ServicableLocation).where(ServicableLocation.partner_id.in_(target_partners)))
            await session.execute(delete(DeliveryPartner).where(DeliveryPartner.email == email))

        if target_sellers:
            await session.execute(delete(Seller).where(Seller.email == email))

        await session.commit()
        return {"detail": f"Successfully deleted data for email {email}"}
    except Exception as e:
        logging.exception("Failed to clear user data")
        raise HTTPException(status_code=500, detail=f"Failed to clear user data: {str(e)}")

@router.get("/clear-all-data")
async def clear_all_db_data(session: SessionDep):
    try:
        from app.database.models import ShipmentEvent, ShipmentTag, Review, ServicableLocation
        await session.execute(delete(ShipmentEvent))
        await session.execute(delete(ShipmentTag))
        await session.execute(delete(Review))
        await session.execute(delete(ServicableLocation))
        await session.execute(delete(Shipment))
        await session.execute(delete(DeliveryPartner))
        await session.execute(delete(Seller))
        await session.commit()
        return {"detail": "All seller, partner, and shipment database records cleared successfully."}
    except Exception as e:
        logging.exception("Failed to clear all DB data")
        raise HTTPException(status_code=500, detail=f"Failed to clear all DB data: {str(e)}")