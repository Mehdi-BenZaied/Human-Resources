from sqlalchemy.orm import Session, joinedload
from app.models.leave_request import LeaveRequest
from app.models.employee import Employee
from app.models.user import User
from app.schemas.leave import LeaveRequestCreate, LeaveStatusUpdate, LeaveRequestOut
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError


def _employee_for_user(db: Session, user_id: str) -> Employee:
    emp = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not emp:
        raise NotFoundError("Employee profile for this user")
    return emp


def _load(db: Session, leave_id: str) -> LeaveRequest:
    lr = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee).joinedload(Employee.department),
        joinedload(LeaveRequest.approved_by_user),
    ).filter(LeaveRequest.id == leave_id).first()
    if not lr:
        raise NotFoundError("Leave request")
    return lr


def list_leave_requests(db: Session, current_user: User) -> list[LeaveRequestOut]:
    query = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee).joinedload(Employee.department),
        joinedload(LeaveRequest.approved_by_user),
    )
    if current_user.role == "employee":
        emp = _employee_for_user(db, current_user.id)
        query = query.filter(LeaveRequest.employee_id == emp.id)

    records = query.order_by(LeaveRequest.created_at.desc()).all()
    return [LeaveRequestOut.model_validate(r) for r in records]


def create_leave_request(db: Session, current_user: User, data: LeaveRequestCreate) -> LeaveRequestOut:
    emp = _employee_for_user(db, current_user.id)

    lr = LeaveRequest(
        employee_id=emp.id,
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason,
        status="pending",
    )
    db.add(lr)
    db.commit()
    db.refresh(lr)
    return LeaveRequestOut.model_validate(_load(db, lr.id))


def update_leave_status(
    db: Session, leave_id: str, current_user: User, data: LeaveStatusUpdate
) -> LeaveRequestOut:
    if current_user.role != "admin":
        raise ForbiddenError("Only admins can update leave request status")

    lr = _load(db, leave_id)
    lr.status = data.status
    lr.admin_comment = data.admin_comment
    lr.approved_by_user_id = current_user.id

    db.commit()
    db.refresh(lr)
    return LeaveRequestOut.model_validate(_load(db, lr.id))


def delete_leave_request(db: Session, leave_id: str, current_user: User) -> None:
    lr = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee)
    ).filter(LeaveRequest.id == leave_id).first()
    if not lr:
        raise NotFoundError("Leave request")

    if current_user.role == "employee":
        emp = _employee_for_user(db, current_user.id)
        if lr.employee_id != emp.id:
            raise ForbiddenError("You can only delete your own leave requests")
        if lr.status != "pending":
            raise BadRequestError("Only pending leave requests can be cancelled")

    db.delete(lr)
    db.commit()
