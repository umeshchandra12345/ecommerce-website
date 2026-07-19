# Use explicit Depends to give type checkers a concrete class
from typing import Annotated, Any, Optional

from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from httpx import request
from pydantic import EmailStr
from api.tags import APITag
from app.database.models import Seller, Shipment
from app.database.redis import add_jti_to_blacklist
from fastapi import APIRouter, Depends, Form, HTTPException, Query, Request, Response, status
import logging
from fastapi.security import OAuth2PasswordRequestForm
from app.config import app_settings

from datetime import timedelta
from app.config import security_settings

from utils import TEMPLATE_DIR, decode_access_token, generate_access_token
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..dependencies import SellerServiceDep, SessionDep, get_seller_access_token, get_current_seller
from ..schemas.seller import SellerCreate, SellerRead, TokenResponse
from ..schemas.shipment import ShipmentRead
from services.seller import SellerService
from core.exceptions import BadCredentials, ClientNotVerified

router = APIRouter(prefix="/seller", tags=[APITag.SELLER])

 
@router.post("/signup", response_model=SellerRead)
async def register_seller(
    seller: SellerCreate,
    service: SellerServiceDep,
):
    return await service.add(seller)

@router.get("/shipments")
async def get_shipments(
    response: Response,
    seller: Annotated[Seller, Depends(get_current_seller)],
    session: SessionDep,
    status: Annotated[Optional[str], Query()] = None,
    search: Annotated[Optional[str], Query()] = None,
    destination: Annotated[Optional[int], Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    stmt = select(Shipment).where(Shipment.seller_id == seller.id)

    if status:
        stmt = stmt.where(Shipment.status == status)
    if destination:
        stmt = stmt.where(Shipment.destination == destination)
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
    # Keep headers for backward compat AND return metadata in body for Vercel edge compatibility
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

@router.get("/me", response_model=SellerRead)
async def get_seller_profile(
    seller: Annotated[Seller, Depends(get_current_seller)],
):
    return seller

###login seller
@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: SellerServiceDep,
    session: SessionDep,
) -> TokenResponse:

    seller = await service.authenticate_seller(
        form_data.username, form_data.password
    )

    if not seller:
        raise BadCredentials()
    if not seller.email_verified:
        raise ClientNotVerified()
    access_token_expires = timedelta(minutes=security_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = generate_access_token(
        data={
            "sub": seller.email,
            "user": {
                "name": seller.name,
                "id": str(seller.id),
            }
        },
        expiry=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


###Verify seller email
@router.get("/verify")
async def verify_seller_email(token:str,service:SellerServiceDep):
    await service.verify_email(token)
    return {"detail":"Account Verified"}

###Email Password reset link
@router.get("/forgot_password")
async def forgot_password(email:EmailStr,service:SellerServiceDep):
    await service.send_password_reset_link(email,router.prefix)
    return {"detail":"Check email for password reset link"}

###Password reset form
@router.get("/reset_password_form")
async def get_reset_password_form(request:Request , token :str):
    templates = Jinja2Templates(TEMPLATE_DIR)
    return templates.TemplateResponse(
        request=request,
        name="reset_password.html",
        context={
            "reset_url": f"http://{app_settings.APP_DOMAIN}{router.prefix}/reset_password?token={token}"
        }
    )

###Reset seller password
@router.post("/reset_password")
async def reset_password_submit(
    token: str,
    request:Request,
    service: SellerServiceDep,
    password: str = Form(...)):
    is_success= await service.reset_password(token, password)
    
    templates=Jinja2Templates(TEMPLATE_DIR)
    
    return templates.TemplateResponse(
        request=request,
        name="password/reset_password_success.html" if is_success else "password/reset_password_failed.html",
    )    
###logout the seller 
@router.get("/logout")
async def logout_seller(token_data:Annotated[dict,Depends(get_seller_access_token)],
):
    await add_jti_to_blacklist(token_data["jti"])
    return {
        "detail":"Successfully logged out"
    }