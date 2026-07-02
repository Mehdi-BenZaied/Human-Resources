import uuid
from datetime import datetime, date
from sqlalchemy import String, DateTime, Date, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    leave_type: Mapped[str] = mapped_column(
        SAEnum("annual_leave", "sick_leave", "maternity_leave", "emergency_leave", name="leave_type"),
        default="annual_leave", nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    admin_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("pending", "approved", "rejected", name="leave_request_status"),
        default="pending", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    approved_by_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    employee: Mapped["Employee"] = relationship(  # type: ignore[name-defined]
        "Employee", back_populates="leave_requests"
    )
    approved_by_user: Mapped["User | None"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="leave_approvals", foreign_keys=[approved_by_user_id]
    )
