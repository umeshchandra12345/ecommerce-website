from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Form, HTTPException, status, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from api.tags import APITag
from app.database.models import TagName
from utils import TEMPLATE_DIR
from app.config import app_settings
templates = Jinja2Templates(directory=str(TEMPLATE_DIR))

from ..dependencies import DeliveryPartnerDep, SellerDep, ShipmentServiceDep, TagServiceDep
from ..schemas.shipment import ShipmentCreate, ShipmentRead, ShipmentReview, ShipmentUpdate, ShipmentTrackResponse
from core.exceptions import NothingToUpdate
Jinja2Templates(TEMPLATE_DIR)
# api router to group endpoints
router = APIRouter(prefix="/shipment", tags=[APITag.SHIPMENT])


### Read a shipment by id
@router.get("/", response_model=ShipmentRead)
async def get_shipment(id: UUID,_:SellerDep, service: ShipmentServiceDep):
    return await service.get(id)


### Create a new shipment with content and weight
@router.post(
    "/",
    response_model=ShipmentRead,
    status_code=status.HTTP_201_CREATED,
    name="create_shipment",
    description="Submit a new **shipment**",
    responses={
        201: {
            "description": "Shipment is created successfully",
        },
        406: {
            "description": "Delivery partner is not available",
        }
    }
)
async def submit_shipment(
    seller:SellerDep,
    shipment: ShipmentCreate,
    service: ShipmentServiceDep,
):
    return await service.add(shipment, seller)


### Update fields of a shipment
@router.patch("/", response_model=ShipmentRead)
async def update_shipment(
    id: UUID,
    shipment_update: ShipmentUpdate,
    partner:DeliveryPartnerDep,
    service: ShipmentServiceDep,
):
    # Update data with given fields
    update = shipment_update.model_dump(exclude_none=True)

    if not update:
        raise NothingToUpdate()
        
    return await service.update(id,shipment_update,partner)

###Add a tag to a shipment
@router.get("/tag",response_model=ShipmentRead)
async def add_tag_to_shipment(
    id:UUID,
    tag:TagName,
    service:ShipmentServiceDep
):
    return await service.add_tag(id,tag)
    
    
###Remove a tag from a shipment
@router.delete("/tag",response_model=ShipmentRead)
async def remove_tag_from_shipment(
    id:UUID,
    tag:TagName,
    service:ShipmentServiceDep
):
    return await service.remove_tag(id,tag)


###Get all shipments by tag
@router.get("/tag/{tag_name}", response_model=list[ShipmentRead])
async def get_shipments_by_tag(
    tag_name: TagName,
    service: TagServiceDep
):
    return await service.get_shipments_by_tag(tag_name)


### cancel a shipment by id
@router.get("/cancel",response_model=ShipmentRead )
async def cancel_shipment(
    id: UUID,
    seller:SellerDep,
    service: ShipmentServiceDep,
):
    return await service.cancel(id,seller)
    


### Public endpoint to track a shipment via query parameter: GET /shipment/track?id=<uuid>
@router.get("/track", response_class=HTMLResponse, include_in_schema=False)
async def track_shipment(request: Request, id: UUID, service: ShipmentServiceDep):
    shipment = await service.get(id)
    
    context=shipment.model_dump()
    context["status"]=shipment.status
    context["partner"] = shipment.delivery_partner.name if shipment.delivery_partner else "Not Assigned"
    context["timeline"]=list(reversed(shipment.timeline)) if shipment.timeline else []
    
    current_status = getattr(shipment.status, "value", str(shipment.status or ""))
    if current_status == "out_for_delivery":
        from app.database.redis import get_shipment_verification_code, add_shipment_verification_code
        from random import randint
        code = await get_shipment_verification_code(shipment.id)
        if not code:
            code = str(randint(100_000, 999_999))
            await add_shipment_verification_code(shipment.id, int(code))
        context["verification_code"] = str(code)
    else:
        context["verification_code"] = None
    
    
    shipment.created_at.strftime("%d/%m/%Y, %H:%M")
    
    return templates.TemplateResponse(
        request=request,
        name="track.html",
        context=context
        
    )

###Get review form for a shipment
@router.get("/review")
async def get_review_form(request:Request,token:str,):
    return templates.TemplateResponse(
        request=request,
        name="review.html",
        context={
            "request_url":f"http://{app_settings.APP_DOMAIN}/shipment/review?token={token}"
        }
    )

###Submit a review for a shipment
@router.post("/review")
async def submit_review(
    token:str,
    rating:Annotated[int,Form(ge=1,le=5)],
    comment:Annotated[str | None,Form()],
    service:ShipmentServiceDep,
):
    await service.rate(token, ShipmentReview(rating=rating, comment=comment))
    return {"detail": "Review Submitted"}