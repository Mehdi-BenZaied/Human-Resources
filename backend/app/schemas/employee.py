from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, EmailStr
from app.schemas.common import BaseSchema


class DeptRef(BaseSchema):
    id: str
    name: str


class ManagerRef(BaseSchema):
    id: str
    name: str


class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    title: str
    salary: Decimal | None = None
    status: str = "active"
    start_date: date
    department_id: str
    manager_id: str | None = None
    profile_picture_url: str | None = None


class EmployeeUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    title: str | None = None
    salary: Decimal | None = None
    status: str | None = None
    start_date: date | None = None
    department_id: str | None = None
    manager_id: str | None = None
    profile_picture_url: str | None = None


class EmployeeOut(BaseSchema):
    id: str
    name: str
    email: str
    title: str
    salary: Decimal | None = None
    status: str
    start_date: date
    profile_picture_url: str | None = None
    department_id: str
    department: DeptRef | None = None
    manager_id: str | None = None
    manager: ManagerRef | None = None
    created_at: datetime
    updated_at: datetime
