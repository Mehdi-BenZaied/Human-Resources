import uuid
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, DateTime, Date, ForeignKey, Enum as SAEnum, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Payroll(Base):
    __tablename__ = "payrolls"
    __table_args__ = (
        UniqueConstraint("period_start", "period_end", name="uq_payroll_period"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    pay_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("draft", "processing", "paid", "failed", name="payroll_status"),
        default="draft", nullable=False
    )
    total_gross: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    total_deductions: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    total_net: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    generated_by_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    generated_by_user: Mapped["User | None"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="payroll_runs", foreign_keys=[generated_by_user_id]
    )
    payslips: Mapped[list["Payslip"]] = relationship(
        "Payslip", back_populates="payroll", cascade="all, delete-orphan"
    )


class Payslip(Base):
    __tablename__ = "payslips"
    __table_args__ = (
        UniqueConstraint("payroll_id", "employee_id", name="uq_payslip_payroll_employee"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    gross_pay: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    bonuses: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"), nullable=False)
    deductions: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"), nullable=False)
    net_pay: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    issued_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    payroll_id: Mapped[str] = mapped_column(String(36), ForeignKey("payrolls.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    employee: Mapped["Employee"] = relationship(  # type: ignore[name-defined]
        "Employee", back_populates="payslips"
    )
    payroll: Mapped["Payroll"] = relationship(
        "Payroll", back_populates="payslips"
    )
