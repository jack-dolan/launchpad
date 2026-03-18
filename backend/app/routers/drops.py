from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Drop, User
from app.schemas import DropCreate, DropOut, DropUpdate

router = APIRouter(prefix="/drops", tags=["drops"])


@router.post("", response_model=DropOut, status_code=status.HTTP_201_CREATED)
async def create_drop(
    payload: DropCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Drop:
    drop = Drop(title=payload.title, description=payload.description, owner_id=current_user.id)
    db.add(drop)
    await db.commit()
    await db.refresh(drop)
    return drop


@router.get("", response_model=list[DropOut])
async def list_drops(db: AsyncSession = Depends(get_db)) -> list[Drop]:
    result = await db.execute(select(Drop).order_by(Drop.created_at.desc()))
    return list(result.scalars().all())


@router.get("/{drop_id}", response_model=DropOut)
async def get_drop(drop_id: int, db: AsyncSession = Depends(get_db)) -> Drop:
    result = await db.execute(select(Drop).where(Drop.id == drop_id))
    drop = result.scalar_one_or_none()
    if drop is None:
        raise HTTPException(status_code=404, detail="Drop not found")
    return drop


@router.patch("/{drop_id}", response_model=DropOut)
async def update_drop(
    drop_id: int,
    payload: DropUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Drop:
    result = await db.execute(select(Drop).where(Drop.id == drop_id))
    drop = result.scalar_one_or_none()
    if drop is None:
        raise HTTPException(status_code=404, detail="Drop not found")
    if drop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    if payload.title is not None:
        drop.title = payload.title
    if payload.description is not None:
        drop.description = payload.description

    await db.commit()
    await db.refresh(drop)
    return drop


@router.delete("/{drop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_drop(
    drop_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    result = await db.execute(select(Drop).where(Drop.id == drop_id))
    drop = result.scalar_one_or_none()
    if drop is None:
        raise HTTPException(status_code=404, detail="Drop not found")
    if drop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    await db.delete(drop)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
