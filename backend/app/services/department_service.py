from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.department import Department
from app.models.employee import Employee
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentOut, DepartmentDetailOut
from app.core.exceptions import NotFoundError, ConflictError, BadRequestError


def _attach_count(db: Session, dept: Department) -> DepartmentOut:
    count = db.query(func.count(Employee.id)).filter(Employee.department_id == dept.id).scalar() or 0
    data = DepartmentOut.model_validate(dept)
    data.employee_count = count
    return data


def list_departments(db: Session) -> list[DepartmentOut]:
    depts = db.query(Department).options(joinedload(Department.manager)).order_by(Department.created_at.desc()).all()
    return [_attach_count(db, d) for d in depts]


def get_department(db: Session, dept_id: str) -> DepartmentDetailOut:
    dept = db.query(Department).options(
        joinedload(Department.manager),
        joinedload(Department.employees),
    ).filter(Department.id == dept_id).first()
    if not dept:
        raise NotFoundError("Department")
    return DepartmentDetailOut.model_validate(dept)


def create_department(db: Session, data: DepartmentCreate) -> DepartmentOut:
    if db.query(Department).filter(Department.name == data.name).first():
        raise ConflictError("A department with this name already exists")
    if data.manager_id and not db.get(Employee, data.manager_id):
        raise NotFoundError("Manager employee")

    dept = Department(**data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return _attach_count(db, dept)


def update_department(db: Session, dept_id: str, data: DepartmentUpdate) -> DepartmentOut:
    dept = db.get(Department, dept_id)
    if not dept:
        raise NotFoundError("Department")

    updates = data.model_dump(exclude_unset=True)

    if "name" in updates:
        existing = db.query(Department).filter(
            Department.name == updates["name"],
            Department.id != dept_id,
        ).first()
        if existing:
            raise ConflictError("A department with this name already exists")

    if "manager_id" in updates and updates["manager_id"] and not db.get(Employee, updates["manager_id"]):
        raise NotFoundError("Manager employee")

    for key, value in updates.items():
        setattr(dept, key, value)

    db.commit()
    db.refresh(dept)
    return _attach_count(db, dept)


def delete_department(db: Session, dept_id: str) -> None:
    dept = db.get(Department, dept_id)
    if not dept:
        raise NotFoundError("Department")

    count = db.query(func.count(Employee.id)).filter(Employee.department_id == dept_id).scalar() or 0
    if count > 0:
        raise BadRequestError(
            f"Cannot delete department with {count} employee(s). Reassign them first."
        )

    db.delete(dept)
    db.commit()
