from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema


class CreatorRef(BaseSchema):
    id: str
    name: str


class NotificationCreate(BaseModel):
    type: str = "announcement"
    title: str
    message: str
    audience_role: str | None = None
    expires_at: datetime | None = None


class NotificationUpdate(BaseModel):
    title: str | None = None
    message: str | None = None
    is_published: bool | None = None


class NotificationOut(BaseSchema):
    id: str
    type: str
    title: str
    message: str
    audience_role: str | None = None
    is_published: bool
    published_at: datetime | None = None
    expires_at: datetime | None = None
    created_by_user_id: str | None = None
    created_by_user: CreatorRef | None = None
    created_at: datetime
    updated_at: datetime
