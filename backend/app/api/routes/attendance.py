from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.attendance import (
    CheckInRequest, CheckOutRequest, AttendanceUpsert,
    AttendanceOut, AttendanceSummary,
)
from app.services import attendance_service
from app.models.user import User

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/check-in", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def check_in(
    data: CheckInRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return attendance_service.check_in(db, data)


@router.post("/check-out", response_model=AttendanceOut)
def check_out(
    data: CheckOutRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return attendance_service.check_out(db, data)


@router.post("/upsert", response_model=AttendanceOut)
def upsert_attendance(
    data: AttendanceUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return attendance_service.upsert_attendance(db, data, current_user)


@router.get("/summary", response_model=AttendanceSummary)
def get_summary(
    employee_id: str = Query(...),
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return attendance_service.get_summary(db, employee_id, month)


@router.get("", response_model=list[AttendanceOut])
def list_attendance(
    work_date: date | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return attendance_service.list_attendance(db, work_date=work_date)
