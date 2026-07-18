from uuid import UUID
from pydantic import BaseModel
from sqlmodel import Field

class BaseDeliveryPartner(BaseModel):
    name: str
    email: str
    serviceable_zip_codes:list[int]
    max_handling_capacity:int

class DeliveryPartnerRead(BaseDeliveryPartner):
    id: UUID

class DeliveryPartnerUpdate(BaseModel):
    serviceable_zip_codes: list[int] | None = None
    max_handling_capacity: int | None = None

class DeliveryPartnerCreate(BaseDeliveryPartner):
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "jwt"