from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.payroll import PayrollCreate, PayrollOut, PayslipCreate, PayslipOut
from app.services import payroll_service
from app.models.user import User

router = APIRouter(prefix="/payroll", tags=["Payroll"])


@router.get("", response_model=list[PayrollOut])
def list_payrolls(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return payroll_service.list_payrolls(db)


@router.post("", response_model=PayrollOut, status_code=status.HTTP_201_CREATED)
def create_payroll(
    data: PayrollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return payroll_service.create_payroll(db, data, current_user)


@router.get("/payslips", response_model=list[PayslipOut])
def list_payslips(
    employee_id: str | None = Query(None),
    payroll_id: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return payroll_service.list_payslips(db, employee_id=employee_id, payroll_id=payroll_id)


@router.post("/payslips", response_model=PayslipOut, status_code=status.HTTP_201_CREATED)
def create_payslip(
    data: PayslipCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return payroll_service.create_payslip(db, data)


@router.get("/my-payslips", response_model=list[PayslipOut])
def my_payslips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return payroll_service.get_my_payslips(db, current_user)
