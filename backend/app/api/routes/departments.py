from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentOut, DepartmentDetailOut
from app.services import department_service
from app.models.user import User

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=list[DepartmentOut])
def list_departments(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return department_service.list_departments(db)


@router.get("/{dept_id}", response_model=DepartmentDetailOut)
def get_department(
    dept_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return department_service.get_department(db, dept_id)


@router.post("", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return department_service.create_department(db, data)


@router.put("/{dept_id}", response_model=DepartmentOut)
def update_department(
    dept_id: str,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return department_service.update_department(db, dept_id, data)


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    dept_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    department_service.delete_department(db, dept_id)
