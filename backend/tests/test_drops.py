from collections.abc import Awaitable, Callable

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import Drop, DropStatus


pytestmark = pytest.mark.asyncio


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def drop_payload(name: str = "Neon Afterparty") -> dict[str, str]:
    return {
        "name": name,
        "description": "A limited drop built for midnight chaos.",
        "vibe": "streetwear hype",
        "drop_date": "2026-08-01T20:00:00Z",
    }


async def create_drop(async_client: AsyncClient, token: str, name: str) -> dict[str, str]:
    response = await async_client.post(
        "/drops/",
        json=drop_payload(name),
        headers=auth_headers(token),
    )

    assert response.status_code == 201
    return response.json()


async def test_create_drop(async_client: AsyncClient, auth_token: str) -> None:
    response = await async_client.post(
        "/drops/",
        json=drop_payload(),
        headers=auth_headers(auth_token),
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["name"] == "Neon Afterparty"
    assert payload["status"] == "draft"
    assert payload["generated_html"] is None
    assert payload["prompt_history"] == []


async def test_list_drops_only_shows_own(
    async_client: AsyncClient,
    create_user_and_token: Callable[[str, str], Awaitable[str]],
) -> None:
    first_token = await create_user_and_token("first@example.com", "super-secret")
    second_token = await create_user_and_token("second@example.com", "super-secret")

    first_drop = await create_drop(async_client, first_token, "First Drop")
    await create_drop(async_client, second_token, "Second Drop")

    response = await async_client.get("/drops/", headers=auth_headers(first_token))

    assert response.status_code == 200
    assert [drop["id"] for drop in response.json()] == [first_drop["id"]]


async def test_get_drop_belonging_to_other_user_returns_404(
    async_client: AsyncClient,
    create_user_and_token: Callable[[str, str], Awaitable[str]],
) -> None:
    owner_token = await create_user_and_token("owner@example.com", "super-secret")
    other_token = await create_user_and_token("other@example.com", "super-secret")
    drop = await create_drop(async_client, owner_token, "Owner Drop")

    response = await async_client.get(
        f"/drops/{drop['id']}",
        headers=auth_headers(other_token),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Drop not found"}


async def test_publish_drop(
    async_client: AsyncClient,
    auth_token: str,
    db_session_maker: async_sessionmaker[AsyncSession],
) -> None:
    drop = await create_drop(async_client, auth_token, "Publishable Drop")

    async with db_session_maker() as session:
        result = await session.execute(select(Drop).where(Drop.id == drop["id"]))
        stored_drop = result.scalar_one()
        stored_drop.generated_html = "<html><body>published</body></html>"
        await session.commit()

    publish_response = await async_client.post(
        f"/drops/{drop['id']}/publish",
        headers=auth_headers(auth_token),
    )
    public_response = await async_client.get(f"/public/drops/{drop['id']}")

    assert publish_response.status_code == 200
    assert publish_response.json()["status"] == DropStatus.PUBLISHED.value
    assert public_response.status_code == 200
    assert public_response.text == "<html><body>published</body></html>"
