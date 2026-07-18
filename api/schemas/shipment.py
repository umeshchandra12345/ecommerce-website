from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
from uuid import UUID

from app.database.models import ShipmentEvent, ShipmentStatus, Tag


class BaseShipment(BaseModel):
    content: str = Field(max_length=100)
    weight: float = Field(le=25)
    destination: int = Field(
        description="location zipcode",
        examples=[110001],
        deprecated="Instead use location"
    )

    @field_validator("content", mode="before")
    @classmethod
    def coerce_content_to_string(cls, v):
        if v is not None:
            return str(v)
        return v


class  ShipmentRead(BaseShipment):
    id: UUID
    timeline: list[ShipmentEvent]
    estimated_delivery: datetime
    tags:list[Tag]


class ShipmentCreate(BaseShipment):
    """
    Shipment details.
    To create a new shipment.
    """
    client_contact_email:EmailStr
    client_contact_phone:str | None=Field(default=None)
    
    @field_validator("client_contact_phone", mode="before")
    @classmethod
    def coerce_phone_to_string(cls, v):
        if v is not None:
            return str(v)
        return v
    

class ShipmentUpdate(BaseModel):
    location:int | None=Field(default=None)
    status: ShipmentStatus | None = Field(default=None)
    verification_code:str | None = Field(default= None)
    description:str | None=Field(default=None)
    estimated_delivery: datetime | None = Field(default=None)
    


class ShipmentTrackResponse(BaseModel):
    id: UUID
    seller: str
    delivery_partner: str | None = None
    status: ShipmentStatus
    destination: int
    estimated_delivery: datetime
    created_at: datetime
    
class ShipmentReview(BaseModel):
    rating:int=Field(ge=1, le=5)
    comment :str | None = Field(default=None)