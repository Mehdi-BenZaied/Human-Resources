from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import BaseSchema


class DepartmentManagerOut(BaseSchema):
    id: str
    name: str
    email: str


class DepartmentCreate(BaseModel):
    name: str
    manager_id: str | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = None
    manager_id: str | None = None


class DepartmentOut(BaseSchema):
    id: str
    name: str
    manager_id: str | None = None
    manager: DepartmentManagerOut | None = None
    employee_count: int = 0
    created_at: datetime
    updated_at: datetime


class DepartmentDetailOut(BaseSchema):
    id: str
    name: str
    manager_id: str | None = None
    manager: DepartmentManagerOut | None = None
    created_at: datetime
    updated_at: datetime
