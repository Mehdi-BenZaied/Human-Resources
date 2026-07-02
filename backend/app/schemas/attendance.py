from datetime import datetime, date
from pydantic import BaseModel
from app.schemas.common import BaseSchema


class EmployeeRef(BaseSchema):
    id: str
    name: str


class CheckInRequest(BaseModel):
    employee_id: str


class CheckOutRequest(BaseModel):
    employee_id: str


class AttendanceUpsert(BaseModel):
    employee_id: str
    work_date: date
    check_in_at: datetime | None = None
    check_out_at: datetime | None = None
    status: str
    correction_note: str | None = None


class AttendanceOut(BaseSchema):
    id: str
    work_date: date
    check_in_at: datetime | None = None
    check_out_at: datetime | None = None
    status: str
    is_manual: bool
    correction_note: str | None = None
    employee_id: str
    employee: EmployeeRef | None = None
    created_at: datetime
    updated_at: datetime


class AttendanceSummary(BaseModel):
    total_days: int
    present: int
    late: int
    absent: int
    half_day: int
    on_leave: int
    records: list[AttendanceOut]
