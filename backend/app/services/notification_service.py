from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationOut
from app.core.exceptions import NotFoundError


def list_notifications(db: Session, current_user: User) -> list[NotificationOut]:
    query = db.query(Notification).options(joinedload(Notification.created_by_user))

    # Filter by audience: show global (None) + role-specific
    query = query.filter(
        (Notification.audience_role == None) |  # noqa: E711
        (Notification.audience_role == current_user.role)
    ).filter(Notification.is_published == True)  # noqa: E712

    records = query.order_by(Notification.created_at.desc()).all()
    return [NotificationOut.model_validate(n) for n in records]


def list_all_notifications(db: Session) -> list[NotificationOut]:
    """Admin view — all notifications regardless of audience."""
    records = db.query(Notification).options(
        joinedload(Notification.created_by_user)
    ).order_by(Notification.created_at.desc()).all()
    return [NotificationOut.model_validate(n) for n in records]


def create_notification(db: Session, data: NotificationCreate, current_user: User) -> NotificationOut:
    notif = Notification(
        type=data.type,
        title=data.title,
        message=data.message,
        audience_role=data.audience_role,
        expires_at=data.expires_at,
        is_published=True,
        published_at=datetime.now(timezone.utc),
        created_by_user_id=current_user.id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return NotificationOut.model_validate(
        db.query(Notification).options(joinedload(Notification.created_by_user))
        .filter(Notification.id == notif.id).first()
    )


def update_notification(
    db: Session, notif_id: str, data: NotificationUpdate
) -> NotificationOut:
    notif = db.get(Notification, notif_id)
    if not notif:
        raise NotFoundError("Notification")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(notif, k, v)
    db.commit()
    db.refresh(notif)
    return NotificationOut.model_validate(
        db.query(Notification).options(joinedload(Notification.created_by_user))
        .filter(Notification.id == notif.id).first()
    )


def delete_notification(db: Session, notif_id: str) -> None:
    notif = db.get(Notification, notif_id)
    if not notif:
        raise NotFoundError("Notification")
    db.delete(notif)
    db.commit()
