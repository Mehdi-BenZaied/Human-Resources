from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.payroll import Payroll, Payslip
from app.models.employee import Employee
from app.models.user import User
from app.schemas.payroll import PayrollCreate, PayrollOut, PayslipCreate, PayslipOut
from app.core.exceptions import NotFoundError, ConflictError, BadRequestError


def list_payrolls(db: Session) -> list[PayrollOut]:
    payrolls = db.query(Payroll).order_by(Payroll.created_at.desc()).all()
    result = []
    for p in payrolls:
        count = db.query(func.count(Payslip.id)).filter(Payslip.payroll_id == p.id).scalar() or 0
        out = PayrollOut.model_validate(p)
        out.payslip_count = count
        result.append(out)
    return result


def create_payroll(db: Session, data: PayrollCreate, current_user: User) -> PayrollOut:
    existing = db.query(Payroll).filter(
        Payroll.period_start == data.period_start,
        Payroll.period_end == data.period_end,
    ).first()
    if existing:
        raise ConflictError("A payroll for this period already exists")

    payroll = Payroll(
        period_start=data.period_start,
        period_end=data.period_end,
        pay_date=data.pay_date,
        status="draft",
        generated_by_user_id=current_user.id,
    )
    db.add(payroll)
    db.commit()
    db.refresh(payroll)

    out = PayrollOut.model_validate(payroll)
    out.payslip_count = 0
    return out


def list_payslips(
    db: Session,
    employee_id: str | None = None,
    payroll_id: str | None = None,
) -> list[PayslipOut]:
    query = db.query(Payslip).options(
        joinedload(Payslip.employee),
        joinedload(Payslip.payroll),
    )
    if employee_id:
        query = query.filter(Payslip.employee_id == employee_id)
    if payroll_id:
        query = query.filter(Payslip.payroll_id == payroll_id)

    slips = query.order_by(Payslip.created_at.desc()).all()
    return [PayslipOut.model_validate(s) for s in slips]


def create_payslip(db: Session, data: PayslipCreate) -> PayslipOut:
    if not db.get(Payroll, data.payroll_id):
        raise NotFoundError("Payroll")
    if not db.get(Employee, data.employee_id):
        raise NotFoundError("Employee")

    existing = db.query(Payslip).filter(
        Payslip.payroll_id == data.payroll_id,
        Payslip.employee_id == data.employee_id,
    ).first()
    if existing:
        raise ConflictError("A payslip for this employee in this payroll period already exists")

    slip = Payslip(
        payroll_id=data.payroll_id,
        employee_id=data.employee_id,
        gross_pay=data.gross_pay,
        bonuses=data.bonuses,
        deductions=data.deductions,
        net_pay=data.net_pay,
        currency=data.currency,
        issued_at=datetime.now(timezone.utc),
    )
    db.add(slip)
    db.commit()
    db.refresh(slip)

    return PayslipOut.model_validate(
        db.query(Payslip).options(
            joinedload(Payslip.employee), joinedload(Payslip.payroll)
        ).filter(Payslip.id == slip.id).first()
    )


def get_my_payslips(db: Session, current_user: User) -> list[PayslipOut]:
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise NotFoundError("Employee profile")
    return list_payslips(db, employee_id=emp.id)
