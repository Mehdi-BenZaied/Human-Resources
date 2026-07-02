import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Enum as SAEnum, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_type: Mapped[str] = mapped_column(
        SAEnum("contract", "id_proof", "payslip", "hr_document", "certificate", "other", name="document_type"),
        default="other", nullable=False
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=True)
    uploaded_by_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    employee: Mapped["Employee | None"] = relationship(  # type: ignore[name-defined]
        "Employee", back_populates="documents"
    )
    uploaded_by_user: Mapped["User | None"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="uploaded_documents", foreign_keys=[uploaded_by_user_id]
    )
