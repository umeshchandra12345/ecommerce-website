from datetime import timedelta
from uuid import UUID
from fastapi import  HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.database.models import User 
from app.config import app_settings
from app.worker.tasks import send_email_with_template, send_email_with_template_async
from services.notification import NotificationService
from utils import (
    generate_access_token,
    generate_url_safe_token,
    decode_url_safe_token,
)
from .base import BaseService
from core.exceptions import InvalidToken, EntityNotFound, BadCredentials, ClientNotVerified

password_context = CryptContext(schemes=["bcrypt"])


class UserService(BaseService):
    def __init__(self, model: User, session: AsyncSession):
        self.model = model
        self.session = session
        
    async def _add_user(self, data: dict, router_prefix: str, base_url: str = None) -> User:
        user_data = data.copy()
        email = user_data.get("email")
        if email:
            existing_user = await self._get_by_email(email)
            if existing_user:
                # Existing email – update password if provided and return the user
                if "password" in user_data:
                    # Re‑hash the new password and update the record
                    password_hash = password_context.hash(user_data.pop("password"))
                    existing_user.password_hash = password_hash
                for key, val in user_data.items():
                    if hasattr(existing_user, key) and val is not None:
                        setattr(existing_user, key, val)
                existing_user.email_verified = True
                await self._update(existing_user)
                return existing_user

        password = user_data.pop("password", None)
        try:
            if not password:
                raise ValueError("Password is required")
            password_hash = password_context.hash(password)
        except (ValueError, TypeError):
            from core.exceptions import PasswordRequired
            raise PasswordRequired()

        user = self.model(
            **user_data,
            email_verified=True,
            password_hash=password_hash
        )
        user = await self._add(user)
        
        token = generate_url_safe_token({
            "email": user.email,
            "id": str(user.id)
        })
        
        import os
        if not base_url:
            protocol = "https" if os.getenv("VERCEL") == "1" else "http"
            base_url = f"{protocol}://{app_settings.APP_DOMAIN}"
        try:
            if os.getenv("VERCEL") == "1":
                await send_email_with_template_async(
                    recipients=[user.email],
                    subject="Verify Your account with FastShip",
                    context={
                        "username": user.name,
                        "verification_url": f"{base_url}/api{router_prefix}/verify?token={token}"
                    },
                    template_name="mail_email.verify.html",
                )
            else:
                send_email_with_template.delay(
                    recipients=[user.email],
                    subject="Verify Your account with FastShip",
                    context={
                        "username": user.name,
                        "verification_url": f"{base_url}/api{router_prefix}/verify?token={token}"
                    },
                    template_name="mail_email.verify.html",
                )
        except Exception:
            # Auto-verify when email service is unavailable (e.g. Vercel serverless)
            user.email_verified = True
            await self._update(user)
        
        return user

    async def verify_email(self, token: str):
        token_data = decode_url_safe_token(token)
        if not token_data or "id" not in token_data:
            raise InvalidToken()
            
        user = await self._get(UUID(token_data["id"]))
        if not user:
            raise EntityNotFound()
        user.email_verified = True  
        await self._update(user)
        return user
        
    async def _get_by_email(self, email) -> User | None:
        if not email:
            return None
        return await self.session.scalar(
            select(self.model).where(self.model.email == email).limit(1)
        )   

    async def _generate_token(self, email: str, password: str) -> str:
        user = await self._get_by_email(email)
        if user is None or not password_context.verify(
            password,
            user.password_hash,
        ):
            raise BadCredentials()
            
        if not user.email_verified:
            raise ClientNotVerified()    
            
        return generate_access_token(data={
            "sub": user.email,
            "user": {
                "name": user.name,
                "id": str(user.id),
            }
        })
        
    async def send_password_reset_link(self, email: str, router_prefix: str, base_url: str = None):
        user = await self._get_by_email(email)
        if not user:
            raise EntityNotFound()
            
        token = generate_url_safe_token({"id": str(user.id)}, salt="password-reset")
            
        if not base_url:
            base_url = f"http://{app_settings.APP_DOMAIN}"
            
        import os
        try:
            if os.getenv("VERCEL") == "1":
                await send_email_with_template_async(
                    recipients=[user.email],
                    subject="FastShip Account Password Reset",
                    context={
                        "username": user.name,
                        "reset_url": f"{base_url}/api{router_prefix}/reset_password_form?token={token}",
                    },
                    template_name="mail_password_reset.html",
                )
            else:
                send_email_with_template.delay(
                    recipients=[user.email],
                    subject="FastShip Account Password Reset",
                    context={
                        "username": user.name,
                        "reset_url": f"{base_url}/api{router_prefix}/reset_password_form?token={token}",
                    },
                    template_name="mail_password_reset.html",
                )
        except Exception:
            pass  # Silently skip if Celery/Redis is unavailable
        
    async def reset_password(self, token: str, password: str)->bool:
        token_data = decode_url_safe_token(
            token,
            salt="password-reset",
            expiry=timedelta(days=1),
        )
        
        if not token_data:
            return False 
            
        user = await self._get(UUID(token_data["id"]))    
        if not user:
            return False
            
        try:
            if not password:
                raise ValueError("Password is required")
            password_hash = password_context.hash(password)
        except (ValueError, TypeError):
            from core.exceptions import PasswordRequired
            raise PasswordRequired()

        user.password_hash = password_hash
        await self._update(user)
        return True