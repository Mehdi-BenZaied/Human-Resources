import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    manager_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employees: Mapped[list["Employee"]] = relationship(  # type: ignore[name-defined]
        "Employee", back_populates="department", foreign_keys="Employee.department_id"
    )
    manager: Mapped["Employee | None"] = relationship(  # type: ignore[name-defined]
        "Employee", back_populates="managed_department", foreign_keys=[manager_id]
    )
    jobs: Mapped[list["Job"]] = relationship(  # type: ignore[name-defined]
        "Job", back_populates="department"
    )
