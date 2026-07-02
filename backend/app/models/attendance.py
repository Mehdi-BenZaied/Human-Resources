import uuid
from datetime import datetime, date
from sqlalchemy import String, DateTime, Date, ForeignKey, Enum as SAEnum, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Attendance(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("employee_id", "work_date", name="uq_employee_work_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    check_out_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("present", "late", "absent", "half_day", "on_leave", name="attendance_status"),
        default="present", nullable=False
    )
    is_manual: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    correction_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    approved_by_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    employee: Mapped["Employee"] = relationship(  # type: ignore[name-defined]
        "Employee", back_populates="attendance_records"
    )
    approved_by_user: Mapped["User | None"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="attendance_approvals", foreign_keys=[approved_by_user_id]
    )
