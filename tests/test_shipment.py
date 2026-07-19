from httpx import AsyncClient
from app.tests import example
from utils import print_label


base_url = "/shipment/"

async def test_submit_shipment_auth(client: AsyncClient):
    response = await client.post(
        base_url,
        json={},
    )
    print_label(response.json())
    assert response.status_code == 401


async def test_submit_shipment(client: AsyncClient, seller_token: str):
    # Submit Shipment
    response = await client.post(
        base_url,
        json=example.SHIPMENT,
        headers={"Authorization": f"Bearer {seller_token}"},
    )

    assert response.status_code == 201

    # Get Shipment
    response = await client.get(
        base_url,
        params={"id": response.json()["id"]},
        headers={"Authorization": f"Bearer {seller_token}"},
    )

    # Check if the shipment is created
    assert response.status_code == 200


async def test_seller_shipments_pagination_and_filter(client: AsyncClient, seller_token: str):
    response = await client.get(
        "/seller/shipments",
        params={"page": 1, "limit": 5, "status": "placed"},
        headers={"Authorization": f"Bearer {seller_token}"},
    )
    assert response.status_code == 200
    assert "x-total-count" in response.headers
    assert "x-page" in response.headers
    assert response.headers["x-page"] == "1"