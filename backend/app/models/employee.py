import uuid
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, DateTime, Date, ForeignKey, Enum as SAEnum, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    salary: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("active", "on_leave", "inactive", name="employee_status"),
        default="active", nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    profile_picture_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    department_id: Mapped[str] = mapped_column(String(36), ForeignKey("departments.id"), nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)
    manager_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    department: Mapped["Department"] = relationship(  # type: ignore[name-defined]
        "Department", back_populates="employees", foreign_keys=[department_id]
    )
    user: Mapped["User | None"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="employee_profile", foreign_keys=[user_id]
    )
    manager: Mapped["Employee | None"] = relationship(
        "Employee", back_populates="subordinates", foreign_keys=[manager_id], remote_side="Employee.id"
    )
    subordinates: Mapped[list["Employee"]] = relationship(
        "Employee", back_populates="manager", foreign_keys=[manager_id]
    )
    managed_department: Mapped["Department | None"] = relationship(  # type: ignore[name-defined]
        "Department", back_populates="manager", foreign_keys="Department.manager_id"
    )
    leave_requests: Mapped[list["LeaveRequest"]] = relationship(  # type: ignore[name-defined]
        "LeaveRequest", back_populates="employee", cascade="all, delete-orphan"
    )
    attendance_records: Mapped[list["Attendance"]] = relationship(  # type: ignore[name-defined]
        "Attendance", back_populates="employee", cascade="all, delete-orphan"
    )
    payslips: Mapped[list["Payslip"]] = relationship(  # type: ignore[name-defined]
        "Payslip", back_populates="employee", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(  # type: ignore[name-defined]
        "Document", back_populates="employee", cascade="all, delete-orphan"
    )
    candidates: Mapped[list["Candidate"]] = relationship(  # type: ignore[name-defined]
        "Candidate", back_populates="employee"
    )
