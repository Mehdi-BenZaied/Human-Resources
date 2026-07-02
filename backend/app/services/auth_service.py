from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest, UserOut, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import ConflictError, UnauthorizedError, ForbiddenError, NotFoundError


def signup(db: Session, data: SignupRequest) -> TokenResponse:
    if db.query(User).filter(User.email == data.email).first():
        raise ConflictError("A user with this email already exists")

    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


def login(db: Session, data: LoginRequest) -> TokenResponse:
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise UnauthorizedError("Invalid email or password")

    if not user.is_active:
        raise ForbiddenError("Account is inactive. Contact your administrator.")

    if not verify_password(data.password, user.password):
        raise UnauthorizedError("Invalid email or password")

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


def get_me(db: Session, user_id: str) -> UserOut:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundError("User")
    return UserOut.model_validate(user)
