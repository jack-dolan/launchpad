from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.codex_service import (
    DEFAULT_GENERATION_DIRECTION,
    LandingPageValidationError,
    generate_landing_page,
    validate_landing_page_html,
)
from app.database import get_db
from app.models import Drop, DropStatus, User
from app.schemas import (
    CreateDropRequest,
    DropResponse,
    GenerateRequest,
    GenerateResponse,
    PromptHistoryEntry,
    UpdateDropRequest,
)

router = APIRouter()
protected_router = APIRouter(prefix="/drops", tags=["drops"])


async def get_user_drop_or_404(drop_id: str, user_id: str, db: AsyncSession) -> Drop:
    """Return a user's drop or raise a 404 when it does not exist for that owner."""
    result = await db.execute(select(Drop).where(Drop.id == drop_id, Drop.user_id == user_id))
    drop = result.scalar_one_or_none()
    if drop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drop not found")
    return drop


@protected_router.get("/", response_model=list[DropResponse])
async def list_drops(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Drop]:
    """List the authenticated user's drops."""
    result = await db.execute(
        select(Drop).where(Drop.user_id == current_user.id).order_by(Drop.created_at.desc())
    )
    return list(result.scalars().all())


@protected_router.post("/", response_model=DropResponse, status_code=status.HTTP_201_CREATED)
async def create_drop(
    payload: CreateDropRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Drop:
    """Create a new draft drop for the authenticated user."""
    drop = Drop(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        vibe=payload.vibe,
        drop_date=payload.drop_date,
        generated_html=None,
        prompt_history=[],
        status=DropStatus.DRAFT,
    )
    db.add(drop)
    await db.commit()
    await db.refresh(drop)
    return drop


@protected_router.get("/{drop_id}", response_model=DropResponse)
async def get_drop(
    drop_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Drop:
    """Return a single drop owned by the authenticated user."""
    return await get_user_drop_or_404(drop_id, current_user.id, db)


@protected_router.put("/{drop_id}", response_model=DropResponse)
async def update_drop(
    drop_id: str,
    payload: UpdateDropRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Drop:
    """Update editable metadata for a drop owned by the authenticated user."""
    drop = await get_user_drop_or_404(drop_id, current_user.id, db)

    if payload.name is not None:
        drop.name = payload.name
    if payload.description is not None:
        drop.description = payload.description
    if payload.vibe is not None:
        drop.vibe = payload.vibe
    if payload.drop_date is not None:
        drop.drop_date = payload.drop_date

    await db.commit()
    await db.refresh(drop)
    return drop


@protected_router.delete("/{drop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_drop(
    drop_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Delete a drop owned by the authenticated user."""
    drop = await get_user_drop_or_404(drop_id, current_user.id, db)
    await db.delete(drop)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@protected_router.post("/{drop_id}/generate", response_model=GenerateResponse)
async def generate_drop_landing_page(
    drop_id: str,
    payload: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GenerateResponse:
    """Generate or iterate on a landing page and persist the resulting HTML."""
    drop = await get_user_drop_or_404(drop_id, current_user.id, db)
    prompt_used = payload.prompt.strip() or DEFAULT_GENERATION_DIRECTION

    try:
        generated_html = await generate_landing_page(
            name=drop.name,
            description=drop.description,
            vibe=drop.vibe,
            drop_date=drop.drop_date,
            previous_html=drop.generated_html,
            iteration_prompt=prompt_used,
        )
        generated_html = validate_landing_page_html(generated_html)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Landing page generation failed: {exc}",
        ) from exc

    updated_prompt_history = [
        *[PromptHistoryEntry.model_validate(entry).model_dump() for entry in drop.prompt_history],
        {"role": "user", "content": prompt_used},
    ]

    drop.generated_html = generated_html
    drop.prompt_history = updated_prompt_history

    await db.commit()
    await db.refresh(drop)
    return GenerateResponse(html=generated_html, prompt_used=prompt_used)


@protected_router.post("/{drop_id}/publish", response_model=DropResponse)
async def publish_drop(
    drop_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Drop:
    """Publish a drop once generated HTML is available."""
    drop = await get_user_drop_or_404(drop_id, current_user.id, db)
    if drop.generated_html is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generate the landing page before publishing",
        )

    try:
        drop.generated_html = validate_landing_page_html(drop.generated_html)
    except LandingPageValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stored landing page HTML is invalid: {exc}",
        ) from exc

    drop.status = DropStatus.PUBLISHED
    await db.commit()
    await db.refresh(drop)
    return drop


@router.get("/public/drops/{drop_id}", response_class=HTMLResponse, tags=["drops"])
async def get_public_drop(drop_id: str, db: AsyncSession = Depends(get_db)) -> HTMLResponse:
    """Return the published landing page HTML for a public drop."""
    result = await db.execute(
        select(Drop).where(Drop.id == drop_id, Drop.status == DropStatus.PUBLISHED)
    )
    drop = result.scalar_one_or_none()
    if drop is None or drop.generated_html is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published drop not found")

    return HTMLResponse(content=drop.generated_html)


router.include_router(protected_router)
