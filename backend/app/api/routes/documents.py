from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentOut
from app.services import document_service
from app.models.user import User

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("", response_model=list[DocumentOut])
def list_documents(
    employee_id: str | None = Query(None),
    document_type: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return document_service.list_documents(db, current_user, employee_id=employee_id, document_type=document_type)


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return document_service.create_document(db, data, current_user)


@router.patch("/{doc_id}", response_model=DocumentOut)
def update_document(
    doc_id: str,
    data: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return document_service.update_document(db, doc_id, data, current_user)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document_service.delete_document(db, doc_id, current_user)
