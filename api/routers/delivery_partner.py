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

templates = Jinja2Templates(directory=str(TEMPLATE_DIR))

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..dependencies import DeliveryPartnerDep, DeliveryPartnerServiceDep, SessionDep, get_partner_access_token, get_current_partner
from ..schemas.delivery_partner import DeliveryPartnerCreate, DeliveryPartnerRead, DeliveryPartnerUpdate, TokenResponse
from ..schemas.shipment import ShipmentRead
from services.seller import SellerService
from core.exceptions import NothingToUpdate
from app.database.models import Shipment

router = APIRouter(prefix="/partner", tags=[APITag.PARTNER])

##register a delivery partner
@router.post("/signup", response_model=DeliveryPartnerRead)
async def register_delivery_partner(
    seller: DeliveryPartnerCreate,
    service: DeliveryPartnerServiceDep,
):
    return await service.add(seller)

@router.get("/shipments", response_model=list[ShipmentRead])
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
        stmt = stmt.where(Shipment.status == status)
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

    return items

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
    return await service.update(
        partner.sqlmodel_update(update)
    )
    

###logout the delivery partner 
@router.get("/logout")
async def logout_delivery_partner(token_data:Annotated[dict,Depends(get_partner_access_token)],
):
    await add_jti_to_blacklist(token_data["jti"])
    return {
        "detail":"Successfully logged out"
    }

###Verify partner email
@router.get("/verify")
async def verify_partner_email(token:str,service:DeliveryPartnerServiceDep):
    await service.verify_email(token)
    return {"detail":"Account Verified"}

###Email Password reset link
@router.get("/forgot_password")
async def forgot_password(email:EmailStr,service:DeliveryPartnerServiceDep):
    await service.send_password_reset_link(email,router.prefix)
    return {"detail":"Check email for password reset link"}

###Reset partner password
@router.get("/reset_password", response_class=HTMLResponse)
async def reset_password_page(request: Request, token: str):
    reset_url = f"http://localhost:8000/partner/reset_password?token={token}"
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
        await service.reset_password(token, password)
        return templates.TemplateResponse(
            request=request,
            name="reset_success.html"
        )
    except Exception:
        return templates.TemplateResponse(
            request=request,
            name="reset_failed.html"
        )