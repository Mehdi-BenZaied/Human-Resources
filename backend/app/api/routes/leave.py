from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.leave import LeaveRequestCreate, LeaveStatusUpdate, LeaveRequestOut
from app.services import leave_service
from app.models.user import User

router = APIRouter(prefix="/leave-requests", tags=["Leave Requests"])


@router.get("", response_model=list[LeaveRequestOut])
def list_leave_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return leave_service.list_leave_requests(db, current_user)


@router.post("", response_model=LeaveRequestOut, status_code=status.HTTP_201_CREATED)
def create_leave_request(
    data: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return leave_service.create_leave_request(db, current_user, data)


@router.patch("/{leave_id}/status", response_model=LeaveRequestOut)
def update_leave_status(
    leave_id: str,
    data: LeaveStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return leave_service.update_leave_status(db, leave_id, current_user, data)


@router.delete("/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leave_request(
    leave_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leave_service.delete_leave_request(db, leave_id, current_user)
