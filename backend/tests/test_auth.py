from collections.abc import Awaitable, Callable

import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


async def test_signup_creates_user_and_returns_token(async_client: AsyncClient) -> None:
    response = await async_client.post(
        "/auth/signup",
        json={"email": "merchant@example.com", "password": "super-secret"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]

    me_response = await async_client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {payload['access_token']}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == "merchant@example.com"


async def test_login_with_valid_credentials(
    async_client: AsyncClient,
    create_user_and_token: Callable[[str, str], Awaitable[str]],
) -> None:
    await create_user_and_token("merchant@example.com", "super-secret")

    response = await async_client.post(
        "/auth/login",
        json={"email": "merchant@example.com", "password": "super-secret"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]


async def test_login_with_wrong_password_returns_401(
    async_client: AsyncClient,
    create_user_and_token: Callable[[str, str], Awaitable[str]],
) -> None:
    await create_user_and_token("merchant@example.com", "super-secret")

    response = await async_client.post(
        "/auth/login",
        json={"email": "merchant@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}


async def test_me_endpoint_requires_auth(async_client: AsyncClient) -> None:
    response = await async_client.get("/auth/me")

    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}
