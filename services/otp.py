from datetime import datetime, timedelta, timezone
from random import randint
from uuid import UUID
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import DeliveryOTP, Shipment, ShipmentStatus
from app.database.redis import add_shipment_verification_code, get_shipment_verification_code
from core.exceptions import (
    EntityNotFound,
    InvalidOTP,
    OTPAlreadyUsed,
    OTPExpired,
    OTPTooManyAttempts,
    ShipmentNotOutForDelivery,
)
from services.sms import SMSNotificationService


class OTPRepository:
    """Repository class for interacting with the delivery_otp database table using SQLAlchemy ORM."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_shipment_id(self, shipment_id: UUID) -> Optional[DeliveryOTP]:
        stmt = select(DeliveryOTP).where(DeliveryOTP.shipment_id == shipment_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_or_update_otp(
        self,
        shipment_id: UUID,
        otp_code: str,
        ttl_minutes: int = 10,
    ) -> DeliveryOTP:
        existing = await self.get_by_shipment_id(shipment_id)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        expires_at = now + timedelta(minutes=ttl_minutes)

        if existing:
            existing.otp_code = otp_code
            existing.created_at = now
            existing.expires_at = expires_at
            existing.attempts = 0
            existing.is_used = False
            otp_record = existing
        else:
            otp_record = DeliveryOTP(
                shipment_id=shipment_id,
                otp_code=otp_code,
                created_at=now,
                expires_at=expires_at,
                attempts=0,
                is_used=False,
            )
            self.session.add(otp_record)

        await self.session.commit()
        await self.session.refresh(otp_record)
        return otp_record

    async def increment_attempts(self, otp_record: DeliveryOTP) -> int:
        otp_record.attempts += 1
        await self.session.commit()
        await self.session.refresh(otp_record)
        return otp_record.attempts

    async def mark_as_used(self, otp_record: DeliveryOTP):
        otp_record.is_used = True
        await self.session.commit()
        await self.session.refresh(otp_record)


class OTPService:
    """Service layer containing business logic for OTP generation, delivery, and verification."""

    def __init__(self, session: AsyncSession, sms_service: Optional[SMSNotificationService] = None):
        self.session = session
        self.repo = OTPRepository(session)
        self.sms_service = sms_service or SMSNotificationService()

    async def generate_and_send_otp(
        self,
        shipment: Shipment,
        ttl_minutes: int = 10,
    ) -> str:
        """Generates a secure 6-digit OTP, stores it in DB & Redis, and sends it to client's email & SMS."""
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # 1. Avoid duplicate OTP generation if an active, unexpired, unused OTP already exists
        existing = await self.repo.get_by_shipment_id(shipment.id)
        if existing and not existing.is_used and existing.expires_at > now:
            otp_code = existing.otp_code
        else:
            otp_code = str(randint(100_000, 999_999))
            await self.repo.create_or_update_otp(
                shipment_id=shipment.id,
                otp_code=otp_code,
                ttl_minutes=ttl_minutes,
            )

        # 2. Sync with Redis cache
        try:
            await add_shipment_verification_code(shipment.id, int(otp_code))
        except Exception:
            pass

        # 3. Send SMS to client contact phone if available
        if shipment.client_contact_phone:
            self.sms_service.send_otp_sms(shipment.client_contact_phone, otp_code)

        return otp_code

    async def verify_otp(
        self,
        shipment_id: UUID,
        entered_otp: str,
        max_attempts: int = 5,
    ) -> bool:
        """Verifies an entered OTP against the database and Redis cache."""
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # 1. Retrieve shipment
        stmt = select(Shipment).where(Shipment.id == shipment_id)
        result = await self.session.execute(stmt)
        shipment = result.scalar_one_or_none()

        if not shipment:
            raise EntityNotFound()

        # 2. Check shipment status
        if shipment.status != ShipmentStatus.out_for_delivery and shipment.status != "out_for_delivery":
            raise ShipmentNotOutForDelivery()

        # 3. Retrieve OTP record from DB
        otp_record = await self.repo.get_by_shipment_id(shipment_id)
        
        # Fallback to Redis if DB record is not found
        if not otp_record:
            redis_code = await get_shipment_verification_code(shipment_id)
            if redis_code and str(redis_code).strip() == str(entered_otp).strip():
                return True
            raise InvalidOTP()

        # 4. Check if already used
        if otp_record.is_used:
            raise OTPAlreadyUsed()

        # 5. Check retry limits
        if otp_record.attempts >= max_attempts:
            raise OTPTooManyAttempts()

        # 6. Check expiration
        if now > otp_record.expires_at:
            raise OTPExpired()

        # 7. Verify OTP match
        if otp_record.otp_code.strip() != entered_otp.strip():
            attempts = await self.repo.increment_attempts(otp_record)
            remaining = max_attempts - attempts
            if remaining <= 0:
                raise OTPTooManyAttempts()
            raise InvalidOTP()

        # 8. Mark as used upon successful verification
        await self.repo.mark_as_used(otp_record)
        return True
