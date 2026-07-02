from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.employee import Employee
from app.models.department import Department
from app.models.leave_request import LeaveRequest
from app.models.attendance import Attendance
from app.models.recruitment import Job, Candidate
from app.schemas.admin import AdminStats


def get_stats(db: Session) -> AdminStats:
    today = datetime.now(timezone.utc).date()

    total_employees = db.query(func.count(Employee.id)).scalar() or 0
    active_employees = db.query(func.count(Employee.id)).filter(Employee.status == "active").scalar() or 0
    total_departments = db.query(func.count(Department.id)).scalar() or 0
    pending_leave = db.query(func.count(LeaveRequest.id)).filter(LeaveRequest.status == "pending").scalar() or 0
    todays_records = db.query(func.count(Attendance.id)).filter(Attendance.work_date == today).scalar() or 0
    todays_present = db.query(func.count(Attendance.id)).filter(
        Attendance.work_date == today, Attendance.status == "present"
    ).scalar() or 0
    todays_late = db.query(func.count(Attendance.id)).filter(
        Attendance.work_date == today, Attendance.status == "late"
    ).scalar() or 0
    open_jobs = db.query(func.count(Job.id)).filter(Job.status == "open").scalar() or 0
    total_candidates = db.query(func.count(Candidate.id)).scalar() or 0

    return AdminStats(
        total_employees=total_employees,
        active_employees=active_employees,
        total_departments=total_departments,
        pending_leave_requests=pending_leave,
        todays_attendance=todays_records,
        todays_present=todays_present,
        todays_late=todays_late,
        open_jobs=open_jobs,
        total_candidates=total_candidates,
    )
