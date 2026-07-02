from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationOut
from app.services import notification_service
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "admin":
        return notification_service.list_all_notifications(db)
    return notification_service.list_notifications(db, current_user)


@router.post("", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return notification_service.create_notification(db, data, current_user)


@router.patch("/{notif_id}", response_model=NotificationOut)
def update_notification(
    notif_id: str,
    data: NotificationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return notification_service.update_notification(db, notif_id, data)


@router.delete("/{notif_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notif_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    notification_service.delete_notification(db, notif_id)
