from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None


class DropBase(BaseModel):
    title: str
    description: str | None = None


class DropCreate(DropBase):
    pass


class DropUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class DropOut(DropBase):
    id: int
    owner_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
