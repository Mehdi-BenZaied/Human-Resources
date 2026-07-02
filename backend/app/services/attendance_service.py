from datetime import datetime, date, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.user import User
from app.schemas.attendance import (
    CheckInRequest, CheckOutRequest, AttendanceUpsert,
    AttendanceOut, AttendanceSummary,
)
from app.core.exceptions import NotFoundError, BadRequestError


def _today_utc() -> date:
    return datetime.now(timezone.utc).date()


def _get_employee_or_404(db: Session, employee_id: str) -> Employee:
    emp = db.get(Employee, employee_id)
    if not emp:
        raise NotFoundError("Employee")
    return emp


def check_in(db: Session, data: CheckInRequest) -> AttendanceOut:
    _get_employee_or_404(db, data.employee_id)
    today = _today_utc()

    existing = db.query(Attendance).filter(
        and_(Attendance.employee_id == data.employee_id, Attendance.work_date == today)
    ).first()
    if existing:
        raise BadRequestError("Already checked in today")

    now = datetime.now(timezone.utc)
    work_day_start = datetime(now.year, now.month, now.day, 9, 0, 0, tzinfo=timezone.utc)
    status = "late" if now > work_day_start else "present"

    record = Attendance(
        employee_id=data.employee_id,
        work_date=today,
        check_in_at=now,
        status=status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AttendanceOut.model_validate(
        db.query(Attendance).options(joinedload(Attendance.employee))
        .filter(Attendance.id == record.id).first()
    )


def check_out(db: Session, data: CheckOutRequest) -> AttendanceOut:
    _get_employee_or_404(db, data.employee_id)
    today = _today_utc()

    record = db.query(Attendance).filter(
        and_(Attendance.employee_id == data.employee_id, Attendance.work_date == today)
    ).first()
    if not record:
        raise NotFoundError("Check-in record for today")
    if record.check_out_at:
        raise BadRequestError("Already checked out today")

    record.check_out_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)

    return AttendanceOut.model_validate(
        db.query(Attendance).options(joinedload(Attendance.employee))
        .filter(Attendance.id == record.id).first()
    )


def upsert_attendance(db: Session, data: AttendanceUpsert, admin_user: User) -> AttendanceOut:
    _get_employee_or_404(db, data.employee_id)

    existing = db.query(Attendance).filter(
        and_(Attendance.employee_id == data.employee_id, Attendance.work_date == data.work_date)
    ).first()

    fields = dict(
        employee_id=data.employee_id,
        work_date=data.work_date,
        check_in_at=data.check_in_at,
        check_out_at=data.check_out_at,
        status=data.status,
        is_manual=True,
        correction_note=data.correction_note,
        approved_by_user_id=admin_user.id,
        approved_at=datetime.now(timezone.utc),
    )

    if existing:
        for k, v in fields.items():
            setattr(existing, k, v)
        record = existing
    else:
        record = Attendance(**fields)
        db.add(record)

    db.commit()
    db.refresh(record)

    return AttendanceOut.model_validate(
        db.query(Attendance).options(joinedload(Attendance.employee))
        .filter(Attendance.id == record.id).first()
    )


def get_summary(db: Session, employee_id: str, month: str) -> AttendanceSummary:
    _get_employee_or_404(db, employee_id)
    year, month_num = (int(x) for x in month.split("-"))
    start = date(year, month_num, 1)
    if month_num == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month_num + 1, 1)

    records = db.query(Attendance).options(joinedload(Attendance.employee)).filter(
        and_(
            Attendance.employee_id == employee_id,
            Attendance.work_date >= start,
            Attendance.work_date < end,
        )
    ).order_by(Attendance.work_date).all()

    out = [AttendanceOut.model_validate(r) for r in records]
    return AttendanceSummary(
        total_days=len(out),
        present=sum(1 for r in out if r.status == "present"),
        late=sum(1 for r in out if r.status == "late"),
        absent=sum(1 for r in out if r.status == "absent"),
        half_day=sum(1 for r in out if r.status == "half_day"),
        on_leave=sum(1 for r in out if r.status == "on_leave"),
        records=out,
    )


def list_attendance(db: Session, work_date: date | None = None) -> list[AttendanceOut]:
    query = db.query(Attendance).options(
        joinedload(Attendance.employee).joinedload(Employee.department)
    )
    if work_date:
        query = query.filter(Attendance.work_date == work_date)
    records = query.order_by(Attendance.work_date.desc()).all()
    return [AttendanceOut.model_validate(r) for r in records]
