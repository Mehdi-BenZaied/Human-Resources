from datetime import datetime, date
from pydantic import BaseModel, field_validator
from app.schemas.common import BaseSchema


class EmployeeRef(BaseSchema):
    id: str
    name: str
    email: str


class ApproverRef(BaseSchema):
    id: str
    name: str


class LeaveRequestCreate(BaseModel):
    leave_type: str = "annual_leave"
    start_date: date
    end_date: date
    reason: str

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v: date, info: any) -> date:
        if "start_date" in info.data and v < info.data["start_date"]:
            raise ValueError("end_date must be on or after start_date")
        return v

    @field_validator("leave_type")
    @classmethod
    def valid_leave_type(cls, v: str) -> str:
        valid = {"annual_leave", "sick_leave", "maternity_leave", "emergency_leave"}
        if v not in valid:
            raise ValueError(f"leave_type must be one of {valid}")
        return v

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 5:
            raise ValueError("Reason must be at least 5 characters")
        return v.strip()


class LeaveStatusUpdate(BaseModel):
    status: str
    admin_comment: str | None = None

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        if v not in ("pending", "approved", "rejected"):
            raise ValueError("status must be pending, approved, or rejected")
        return v


class LeaveRequestOut(BaseSchema):
    id: str
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    admin_comment: str | None = None
    status: str
    employee_id: str
    employee: EmployeeRef | None = None
    approved_by_user_id: str | None = None
    approved_by_user: ApproverRef | None = None
    created_at: datetime
    updated_at: datetime
