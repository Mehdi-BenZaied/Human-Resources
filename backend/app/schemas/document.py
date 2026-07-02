from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema


class EmployeeRef(BaseSchema):
    id: str
    name: str


class DocumentCreate(BaseModel):
    document_type: str = "other"
    title: str
    file_name: str
    file_url: str
    mime_type: str | None = None
    file_size: int | None = None
    description: str | None = None
    is_confidential: bool = False
    employee_id: str | None = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    is_confidential: bool | None = None


class DocumentOut(BaseSchema):
    id: str
    document_type: str
    title: str
    file_name: str
    file_url: str
    mime_type: str | None = None
    file_size: int | None = None
    description: str | None = None
    is_confidential: bool
    uploaded_at: datetime
    employee_id: str | None = None
    employee: EmployeeRef | None = None
    uploaded_by_user_id: str | None = None
    created_at: datetime
    updated_at: datetime
