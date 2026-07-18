
from uuid import UUID
from httpx import AsyncClient
from utils import print_label

async def test_app(client: AsyncClient):
    response = await client.get("/")
    
    print_label(response.json())
    assert response.status_code == 200
    
    assert response.json().get("message") == "welcome to fastship API"


async def test_signup_empty_password(client: AsyncClient):
    payload = {
        "name": "Empty PW Seller",
        "email": "empty_pw@example.com",
        "password": "",
        "address": "123 St",
        "zip_code": 110001
    }
    response = await client.post("/seller/signup", json=payload)
    print_label(response.json())
    assert response.status_code == 400
    assert response.json()["detail"] == "Password is required"