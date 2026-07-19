from uuid import UUID
from pydantic import BaseModel, field_validator

class BaseDeliveryPartner(BaseModel):
    name: str
    email: str
    serviceable_zip_codes: list[int] = []
    max_handling_capacity: int

    model_config = {"from_attributes": True}

    @field_validator("serviceable_zip_codes", mode="before")
    @classmethod
    def coerce_zip_codes(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            res = []
            for item in v:
                if hasattr(item, "zip_code"):
                    res.append(item.zip_code)
                elif isinstance(item, int):
                    res.append(item)
            return res
        return v

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