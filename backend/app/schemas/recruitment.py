from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.schemas.common import BaseSchema


class DeptRef(BaseSchema):
    id: str
    name: str


class JobCreate(BaseModel):
    title: str
    description: str
    location: str | None = None
    department_id: str | None = None
    status: str = "draft"


class JobUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    department_id: str | None = None
    status: str | None = None


class JobOut(BaseSchema):
    id: str
    title: str
    description: str
    location: str | None = None
    status: str
    opened_at: datetime | None = None
    closed_at: datetime | None = None
    department_id: str | None = None
    department: DeptRef | None = None
    candidate_count: int = 0
    created_at: datetime
    updated_at: datetime


class CandidateCreate(BaseModel):
    job_id: str
    name: str
    email: EmailStr
    phone: str | None = None
    resume_url: str | None = None
    cover_letter: str | None = None
    status: str = "applied"


class CandidateUpdate(BaseModel):
    status: str | None = None
    interview_at: datetime | None = None
    notes: str | None = None


class CandidateOut(BaseSchema):
    id: str
    name: str
    email: str
    phone: str | None = None
    resume_url: str | None = None
    cover_letter: str | None = None
    status: str
    interview_at: datetime | None = None
    notes: str | None = None
    job_id: str
    employee_id: str | None = None
    created_at: datetime
    updated_at: datetime
