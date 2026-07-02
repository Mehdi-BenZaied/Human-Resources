from pydantic import BaseModel


class AdminStats(BaseModel):
    total_employees: int
    active_employees: int
    total_departments: int
    pending_leave_requests: int
    todays_attendance: int
    todays_present: int
    todays_late: int
    open_jobs: int
    total_candidates: int
