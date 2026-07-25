import pytest
from httpx import AsyncClient
from utils import generate_url_safe_token, decode_url_safe_token
from app.database.models import TagName
from uuid import UUID

# Use anyio/asyncio mode
pytestmark = pytest.mark.asyncio

async def test_seller_full_flow(client: AsyncClient):
    # 1. Signup Seller
    signup_payload = {
        "name": "New Seller",
        "email": "new_seller@example.com",
        "password": "password123",
        "address": "456 Seller Lane",
        "zip_code": 110001
    }
    response = await client.post("/seller/signup", json=signup_payload)
    assert response.status_code == 200
    seller_id = response.json()["id"]

    # 2. Verify Seller Email
    verify_token = generate_url_safe_token({
        "email": "new_seller@example.com",
        "id": seller_id
    })
    response = await client.get("/seller/verify", params={"token": verify_token})
    assert response.status_code == 200
    assert response.json()["detail"] == "Account Verified"

    # 3. Token Login
    login_payload = {
        "grant_type": "password",
        "username": "new_seller@example.com",
        "password": "password123",
    }
    response = await client.post("/seller/token", data=login_payload)
    assert response.status_code == 200
    access_token = response.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    # 4. Profile /seller/me
    response = await client.get("/seller/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "new_seller@example.com"

    # 5. Forgot Password
    response = await client.get("/seller/forgot_password", params={"email": "new_seller@example.com"})
    assert response.status_code == 200
    assert response.json()["detail"] == "Check email for password reset link"

    # 6. Reset Password Form (GET)
    reset_token = generate_url_safe_token({"id": seller_id}, salt="password-reset")
    response = await client.get("/seller/reset_password_form", params={"token": reset_token})
    assert response.status_code == 200

    # 7. Reset Password Submit (POST)
    response = await client.post("/seller/reset_password", params={"token": reset_token}, data={"password": "newpassword123"})
    assert response.status_code == 200
    assert "reset_success.html" in response.text or "Reset Successful" in response.text

    # 8. Logout
    response = await client.get("/seller/logout", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["detail"] == "Successfully logged out"


async def test_partner_full_flow(client: AsyncClient):
    # 1. Signup Partner
    signup_payload = {
        "name": "New Partner",
        "email": "new_partner@example.com",
        "password": "password123",
        "serviceable_zip_codes": [110001],
        "max_handling_capacity": 5
    }
    response = await client.post("/partner/signup", json=signup_payload)
    assert response.status_code == 200
    partner_id = response.json()["id"]

    # 2. Verify Partner Email
    verify_token = generate_url_safe_token({
        "email": "new_partner@example.com",
        "id": partner_id
    })
    response = await client.get("/partner/verify", params={"token": verify_token})
    assert response.status_code == 200
    assert response.json()["detail"] == "Account Verified"

    # 3. Token Login
    login_payload = {
        "grant_type": "password",
        "username": "new_partner@example.com",
        "password": "password123",
    }
    response = await client.post("/partner/token", data=login_payload)
    assert response.status_code == 200
    access_token = response.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    # 4. Profile /partner/me
    response = await client.get("/partner/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "new_partner@example.com"
    assert response.json()["serviceable_zip_codes"] == [110001]

    # 5. Update partner profile (serviceable zip codes & capacity)
    update_payload = {
        "max_handling_capacity": 12,
        "serviceable_zip_codes": [110001, 110002]
    }
    response = await client.post("/partner/", json=update_payload, headers=auth_headers)
    assert response.status_code == 200
    
    # Verify update persisted
    response = await client.get("/partner/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["max_handling_capacity"] == 12
    assert set(response.json()["serviceable_zip_codes"]) == {110001, 110002}

    # 6. Forgot Password
    response = await client.get("/partner/forgot_password", params={"email": "new_partner@example.com"})
    assert response.status_code == 200
    assert response.json()["detail"] == "Check email for password reset link"

    # 7. Reset Password Form (GET)
    reset_token = generate_url_safe_token({"id": partner_id}, salt="password-reset")
    response = await client.get("/partner/reset_password_form", params={"token": reset_token})
    assert response.status_code == 200

    # 8. Reset Password Submit (POST)
    response = await client.post("/partner/reset_password", params={"token": reset_token}, data={"password": "newpassword123"})
    assert response.status_code == 200
    assert "reset_success.html" in response.text or "Reset Successful" in response.text

    # 9. Logout
    response = await client.get("/partner/logout", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["detail"] == "Successfully logged out"


async def test_shipment_full_flow(client: AsyncClient, seller_token: str):
    # Pre-seeded partner exists in tests via conftest setup (partner@example.com).
    # Get partner token to update shipment.
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

    # 1. Create Shipment
    shipment_payload = {
        "content": "Deluxe Laptop",
        "weight": 3.2,
        "destination": 110001,
        "client_contact_email": "client@example.com",
        "client_contact_phone": "9998887776"
    }
    response = await client.post("/shipment/", json=shipment_payload, headers=seller_headers)
    assert response.status_code == 201
    shipment = response.json()
    shipment_id = shipment["id"]

    # 2. Get Shipment
    response = await client.get("/shipment/", params={"id": shipment_id}, headers=seller_headers)
    assert response.status_code == 200
    assert response.json()["content"] == "Deluxe Laptop"

    # 3. Add Tag to Shipment
    response = await client.get("/shipment/tag", params={"id": shipment_id, "tag": "fragile"}, headers=seller_headers)
    assert response.status_code == 200
    tags = response.json()["tags"]
    assert any(t["name"] == "fragile" for t in tags)

    # 4. Get shipments by tag
    response = await client.get("/shipment/tag/fragile")
    assert response.status_code == 200
    assert any(s["id"] == shipment_id for s in response.json())

    # 5. Remove Tag from Shipment
    response = await client.delete("/shipment/tag", params={"id": shipment_id, "tag": "fragile"}, headers=seller_headers)
    assert response.status_code == 200
    tags = response.json()["tags"]
    assert not any(t["name"] == "fragile" for t in tags)

    # 6. Update Shipment Status
    update_payload = {
        "status": "in_transit",
        "location": 110001,
        "description": "Departed facility"
    }
    response = await client.patch("/shipment/", params={"id": shipment_id}, json=update_payload, headers=partner_headers)
    assert response.status_code == 200

    # 7. Cancel Shipment (let's create another one and cancel it)
    response = await client.post("/shipment/", json=shipment_payload, headers=seller_headers)
    assert response.status_code == 201
    cancel_id = response.json()["id"]

    response = await client.get("/shipment/cancel", params={"id": cancel_id}, headers=seller_headers)
    assert response.status_code == 200
    assert response.json()["timeline"][-1]["status"] == "cancelled"

    # 8. Track Shipment (HTML)
    response = await client.get("/shipment/track", params={"id": shipment_id})
    assert response.status_code == 200

    # 9. Track HTML
    response = await client.get("/shipment/track-html", params={"id": shipment_id})
    assert response.status_code == 200

    # 10. Review Endpoint
    review_token = generate_url_safe_token({"id": shipment_id})
    # GET Review Form
    response = await client.get("/shipment/review", params={"token": review_token})
    assert response.status_code == 200

    # POST Submit Review
    response = await client.post("/shipment/review", params={"token": review_token}, data={"rating": 5, "comment": "Excellent service!"})
    assert response.status_code == 200
    assert response.json()["detail"] == "Review Submitted"
