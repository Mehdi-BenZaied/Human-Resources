from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.models.employee import Employee
from app.models.department import Department
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.core.exceptions import NotFoundError, ConflictError, BadRequestError


def _get_or_404(db: Session, employee_id: str) -> Employee:
    emp = db.query(Employee).options(
        joinedload(Employee.department),
        joinedload(Employee.manager),
    ).filter(Employee.id == employee_id).first()
    if not emp:
        raise NotFoundError("Employee")
    return emp


def list_employees(
    db: Session,
    q: str | None = None,
    department_id: str | None = None,
    status: str | None = None,
) -> list[EmployeeOut]:
    query = db.query(Employee).options(
        joinedload(Employee.department),
        joinedload(Employee.manager),
    )
    if q:
        query = query.filter(
            or_(
                Employee.name.ilike(f"%{q}%"),
                Employee.email.ilike(f"%{q}%"),
                Employee.title.ilike(f"%{q}%"),
            )
        )
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if status:
        query = query.filter(Employee.status == status)

    employees = query.order_by(Employee.created_at.desc()).all()
    return [EmployeeOut.model_validate(e) for e in employees]


def get_employee(db: Session, employee_id: str) -> EmployeeOut:
    return EmployeeOut.model_validate(_get_or_404(db, employee_id))


def create_employee(db: Session, data: EmployeeCreate) -> EmployeeOut:
    if not db.get(Department, data.department_id):
        raise NotFoundError("Department")
    if db.query(Employee).filter(Employee.email == data.email).first():
        raise ConflictError("An employee with this email already exists")
    if data.manager_id and not db.get(Employee, data.manager_id):
        raise NotFoundError("Manager")

    emp = Employee(**data.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return EmployeeOut.model_validate(_get_or_404(db, emp.id))


def update_employee(db: Session, employee_id: str, data: EmployeeUpdate) -> EmployeeOut:
    emp = _get_or_404(db, employee_id)

    updates = data.model_dump(exclude_unset=True)

    if "department_id" in updates and not db.get(Department, updates["department_id"]):
        raise NotFoundError("Department")
    if "manager_id" in updates and updates["manager_id"] and not db.get(Employee, updates["manager_id"]):
        raise NotFoundError("Manager")
    if "email" in updates:
        existing = db.query(Employee).filter(
            Employee.email == updates["email"],
            Employee.id != employee_id,
        ).first()
        if existing:
            raise ConflictError("An employee with this email already exists")

    for key, value in updates.items():
        setattr(emp, key, value)

    db.commit()
    db.refresh(emp)
    return EmployeeOut.model_validate(_get_or_404(db, emp.id))


def delete_employee(db: Session, employee_id: str) -> None:
    emp = db.get(Employee, employee_id)
    if not emp:
        raise NotFoundError("Employee")
    db.delete(emp)
    db.commit()
