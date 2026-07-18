from datetime import datetime, timedelta, timezone

from fastapi import HTTPException,status

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas.seller import SellerCreate
from app.database.models import Seller
from services.user import UserService
from utils import generate_access_token
from services.user import password_context

class SellerService(UserService):
    def __init__(self, session: AsyncSession, tasks=None):
        super().__init__(Seller, session)
        
    async def add(self,seller_create:SellerCreate)->Seller:
        
        return await self._add_user(
            seller_create.model_dump(),
            "seller"
            )
    
    async def authenticate_seller(self, email: str, password: str) -> Seller | None:
        seller = await self._get_by_email(email)
        if seller is None or not password_context.verify(
            password,
            seller.password_hash,
        ):
            return None
        return seller

    async def token(self, email: str, password: str) -> str:
        return await self._generate_token(email,password)
