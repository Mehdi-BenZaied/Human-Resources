from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator
from app.schemas.common import BaseSchema


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "employee"

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        if v not in ("admin", "employee"):
            raise ValueError("Role must be admin or employee")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseSchema):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class AuthResponse(BaseModel):
    message: str
    data: TokenResponse
