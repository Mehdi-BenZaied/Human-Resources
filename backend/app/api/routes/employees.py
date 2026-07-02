from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.services import employee_service
from app.models.user import User

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=list[EmployeeOut])
def list_employees(
    q: str | None = Query(None),
    department_id: str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return employee_service.list_employees(db, q=q, department_id=department_id, status=status)


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return employee_service.get_employee(db, employee_id)


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return employee_service.create_employee(db, data)


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return employee_service.update_employee(db, employee_id, data)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    employee_service.delete_employee(db, employee_id)
