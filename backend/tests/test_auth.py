import pytest


pytestmark = pytest.mark.asyncio


async def test_signup_returns_token_and_me_profile(async_client) -> None:
    signup_response = await async_client.post(
        "/auth/signup",
        json={"email": "merchant@example.com", "password": "super-secret"},
    )

    assert signup_response.status_code == 201
    token_payload = signup_response.json()
    assert token_payload["token_type"] == "bearer"
    assert token_payload["access_token"]

    me_response = await async_client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token_payload['access_token']}"},
    )

    assert me_response.status_code == 200
    me_payload = me_response.json()
    assert me_payload["email"] == "merchant@example.com"
    assert isinstance(me_payload["id"], str)
    assert me_payload["created_at"]


async def test_signup_rejects_duplicate_email(async_client) -> None:
    payload = {"email": "merchant@example.com", "password": "super-secret"}

    first_response = await async_client.post("/auth/signup", json=payload)
    second_response = await async_client.post("/auth/signup", json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 400
    assert second_response.json() == {"detail": "Email already registered"}


async def test_login_returns_token_for_valid_credentials(async_client) -> None:
    await async_client.post(
        "/auth/signup",
        json={"email": "merchant@example.com", "password": "super-secret"},
    )

    login_response = await async_client.post(
        "/auth/login",
        json={"email": "merchant@example.com", "password": "super-secret"},
    )

    assert login_response.status_code == 200
    login_payload = login_response.json()
    assert login_payload["token_type"] == "bearer"
    assert login_payload["access_token"]


async def test_login_rejects_bad_credentials(async_client) -> None:
    await async_client.post(
        "/auth/signup",
        json={"email": "merchant@example.com", "password": "super-secret"},
    )

    login_response = await async_client.post(
        "/auth/login",
        json={"email": "merchant@example.com", "password": "wrong-password"},
    )

    assert login_response.status_code == 401
    assert login_response.json() == {"detail": "Invalid email or password"}


async def test_me_requires_valid_bearer_token(async_client) -> None:
    response = await async_client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Could not validate credentials"}
