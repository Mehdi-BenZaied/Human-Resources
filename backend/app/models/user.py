import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(SAEnum("admin", "employee", name="user_role"), default="employee", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    password_reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employee_profile: Mapped["Employee | None"] = relationship(  # type: ignore[name-defined]
        "Employee", back_populates="user", foreign_keys="Employee.user_id", uselist=False
    )
    notifications_created: Mapped[list["Notification"]] = relationship(  # type: ignore[name-defined]
        "Notification", back_populates="created_by_user", foreign_keys="Notification.created_by_user_id"
    )
    leave_approvals: Mapped[list["LeaveRequest"]] = relationship(  # type: ignore[name-defined]
        "LeaveRequest", back_populates="approved_by_user", foreign_keys="LeaveRequest.approved_by_user_id"
    )
    attendance_approvals: Mapped[list["Attendance"]] = relationship(  # type: ignore[name-defined]
        "Attendance", back_populates="approved_by_user", foreign_keys="Attendance.approved_by_user_id"
    )
    payroll_runs: Mapped[list["Payroll"]] = relationship(  # type: ignore[name-defined]
        "Payroll", back_populates="generated_by_user", foreign_keys="Payroll.generated_by_user_id"
    )
    uploaded_documents: Mapped[list["Document"]] = relationship(  # type: ignore[name-defined]
        "Document", back_populates="uploaded_by_user", foreign_keys="Document.uploaded_by_user_id"
    )
