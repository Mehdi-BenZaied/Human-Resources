from sqlalchemy.orm import Session, joinedload
from app.models.document import Document
from app.models.employee import Employee
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentOut
from app.core.exceptions import NotFoundError, ForbiddenError


def list_documents(
    db: Session,
    current_user: User,
    employee_id: str | None = None,
    document_type: str | None = None,
) -> list[DocumentOut]:
    query = db.query(Document).options(joinedload(Document.employee))

    if current_user.role == "employee":
        # Employees see only their own non-confidential docs
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp:
            query = query.filter(Document.employee_id == emp.id)
        query = query.filter(Document.is_confidential == False)  # noqa: E712
    else:
        if employee_id:
            query = query.filter(Document.employee_id == employee_id)

    if document_type:
        query = query.filter(Document.document_type == document_type)

    records = query.order_by(Document.created_at.desc()).all()
    return [DocumentOut.model_validate(d) for d in records]


def create_document(db: Session, data: DocumentCreate, current_user: User) -> DocumentOut:
    if data.employee_id and not db.get(Employee, data.employee_id):
        raise NotFoundError("Employee")

    doc = Document(
        **data.model_dump(),
        uploaded_by_user_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return DocumentOut.model_validate(
        db.query(Document).options(joinedload(Document.employee))
        .filter(Document.id == doc.id).first()
    )


def update_document(
    db: Session, doc_id: str, data: DocumentUpdate, current_user: User
) -> DocumentOut:
    doc = db.get(Document, doc_id)
    if not doc:
        raise NotFoundError("Document")

    if current_user.role != "admin" and doc.uploaded_by_user_id != current_user.id:
        raise ForbiddenError("You can only edit your own documents")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(doc, k, v)
    db.commit()
    db.refresh(doc)
    return DocumentOut.model_validate(
        db.query(Document).options(joinedload(Document.employee))
        .filter(Document.id == doc.id).first()
    )


def delete_document(db: Session, doc_id: str, current_user: User) -> None:
    doc = db.get(Document, doc_id)
    if not doc:
        raise NotFoundError("Document")
    if current_user.role != "admin" and doc.uploaded_by_user_id != current_user.id:
        raise ForbiddenError("You can only delete your own documents")
    db.delete(doc)
    db.commit()
