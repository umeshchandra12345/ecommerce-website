from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator

class BaseSeller(BaseModel):
    name: str
    email: str
    address: str | None = None
    zip_code: int | None = None

    @field_validator("address", mode="before")
    @classmethod
    def coerce_address_to_string(cls, v):
        if v is not None:
            return str(v)
        return v

class SellerRead(BaseSeller):
    id: UUID

class SellerCreate(BaseSeller):
    password: str
    
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "jwt"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str