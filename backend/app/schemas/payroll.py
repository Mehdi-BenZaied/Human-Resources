from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel
from app.schemas.common import BaseSchema


class EmployeeRef(BaseSchema):
    id: str
    name: str
    email: str


class PayrollRef(BaseSchema):
    id: str
    period_start: date
    period_end: date


class PayrollCreate(BaseModel):
    period_start: date
    period_end: date
    pay_date: date | None = None


class PayrollOut(BaseSchema):
    id: str
    period_start: date
    period_end: date
    pay_date: date | None = None
    status: str
    total_gross: Decimal | None = None
    total_deductions: Decimal | None = None
    total_net: Decimal | None = None
    payslip_count: int = 0
    created_at: datetime
    updated_at: datetime


class PayslipCreate(BaseModel):
    payroll_id: str
    employee_id: str
    gross_pay: Decimal
    bonuses: Decimal = Decimal("0")
    deductions: Decimal = Decimal("0")
    net_pay: Decimal
    currency: str = "USD"


class PayslipOut(BaseSchema):
    id: str
    gross_pay: Decimal
    bonuses: Decimal
    deductions: Decimal
    net_pay: Decimal
    currency: str
    issued_at: datetime | None = None
    employee_id: str
    employee: EmployeeRef | None = None
    payroll_id: str
    payroll: PayrollRef | None = None
    created_at: datetime
    updated_at: datetime
