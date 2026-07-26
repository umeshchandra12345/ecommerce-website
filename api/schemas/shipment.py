from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from uuid import UUID

from app.database.models import ShipmentEvent, ShipmentStatus, Tag


class BaseShipment(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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


class ShipmentRead(BaseShipment):
    id: UUID
    timeline: list[ShipmentEvent]
    estimated_delivery: datetime | None = None
    tags: list[Tag]


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
    location: int | None = Field(default=None)
    status: ShipmentStatus | None = Field(default=None)
    verification_code: str | None = Field(default=None)
    description: str | None = Field(default=None)
    estimated_delivery: datetime | None = Field(default=None)

    @field_validator("location", mode="before")
    @classmethod
    def coerce_location(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            try:
                return int(v.strip())
            except ValueError:
                return None
        return v
    


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


class OTPVerifyRequest(BaseModel):
    shipment_id: UUID
    otp: str = Field(min_length=6, max_length=6, description="6-digit OTP verification code")


class OTPVerifyResponse(BaseModel):
    detail: str = "Delivery verified successfully"
    shipment_id: UUID
    status: ShipmentStatus = ShipmentStatus.delivered
    delivered_at: datetime