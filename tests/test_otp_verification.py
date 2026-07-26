import pytest
from uuid import UUID
from httpx import AsyncClient
from sqlalchemy import select

from tests.conftest import get_session_override
from app.database.models import DeliveryOTP
from app.database.redis import get_shipment_verification_code

pytestmark = pytest.mark.asyncio

async def test_otp_delivery_verification_full_flow(client: AsyncClient, seller_token: str):
    # 1. Login Partner
    login_payload = {
        "grant_type": "password",
        "username": "partner@example.com",
        "password": "password123",
    }
    response = await client.post("/partner/token", data=login_payload)
    assert response.status_code == 200
    partner_token = response.json()["access_token"]
    partner_headers = {"Authorization": f"Bearer {partner_token}"}
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    # 2. Create Shipment
    shipment_payload = {
        "content": "MacBook Pro M3",
        "weight": 2.1,
        "destination": 110001,
        "client_contact_email": "client_otp_test@example.com",
        "client_contact_phone": "+15551234567"
    }
    response = await client.post("/shipment/", json=shipment_payload, headers=seller_headers)
    assert response.status_code == 201
    shipment_id = response.json()["id"]

    # 3. Transition to OUT_FOR_DELIVERY -> Generates OTP in DB and Redis
    response = await client.patch("/shipment/", params={"id": shipment_id}, json={"status": "out_for_delivery"}, headers=partner_headers)
    assert response.status_code == 200

    # 4. Verify OTP record created in DB
    async for session in get_session_override():
        otp_record = (await session.execute(select(DeliveryOTP).where(DeliveryOTP.shipment_id == UUID(shipment_id)))).scalar_one_or_none()
        assert otp_record is not None
        assert len(otp_record.otp_code) == 6
        assert otp_record.is_used is False
        assert otp_record.attempts == 0
        actual_otp = otp_record.otp_code
        break

    # 5. Attempt OTP verification with WRONG OTP -> Fails with HTTP 400
    verify_fail = await client.post("/shipment/verify-otp", json={"shipment_id": shipment_id, "otp": "000000"}, headers=partner_headers)
    assert verify_fail.status_code == 400

    # 6. Attempt OTP verification via POST /shipment/verify-otp with CORRECT OTP -> Succeeds with HTTP 200
    verify_success = await client.post("/shipment/verify-otp", json={"shipment_id": shipment_id, "otp": actual_otp}, headers=partner_headers)
    assert verify_success.status_code == 200
    assert verify_success.json()["status"] == "delivered"
    assert verify_success.json()["delivered_at"] is not None

    # 7. Check OTP record in DB -> Marked as used
    async for session in get_session_override():
        otp_record = (await session.execute(select(DeliveryOTP).where(DeliveryOTP.shipment_id == UUID(shipment_id)))).scalar_one_or_none()
        assert otp_record.is_used is True
        break

    # 8. Attempt OTP verification with ALREADY USED OTP -> Fails with HTTP 400
    verify_reused = await client.post("/shipment/verify-otp", json={"shipment_id": shipment_id, "otp": actual_otp}, headers=partner_headers)
    assert verify_reused.status_code == 400
