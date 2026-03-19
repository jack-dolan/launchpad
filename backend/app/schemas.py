from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models import DropStatus


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


class PromptHistoryEntry(BaseModel):
    role: str
    content: str


class CreateDropRequest(BaseModel):
    name: str
    description: str
    vibe: str
    drop_date: datetime


class UpdateDropRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    vibe: str | None = None
    drop_date: datetime | None = None


class DropResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    vibe: str
    drop_date: datetime
    generated_html: str | None
    prompt_history: list[PromptHistoryEntry]
    status: DropStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GenerateRequest(BaseModel):
    prompt: str


class GenerateResponse(BaseModel):
    html: str
    prompt_used: str
