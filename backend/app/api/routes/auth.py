import datetime
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
import bcrypt
import jwt

from app.database.database import get_db
from app.database.models import User
from app.core.config import settings
from app.core.sanitizer import sanitize_text
from app.api.deps import get_current_user

router = APIRouter()

# -- Helpers --

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    # Support legacy "hashed_" prefix passwords for graceful migration
    if hashed.startswith("hashed_"):
        return password == hashed.replace("hashed_", "")
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_jwt(user_id: int, role: str) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": now + datetime.timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        "iat": now,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# -- Request / Response Models --

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: Optional[str] = "lecturer"
    full_name: Optional[str] = "Academic User"
    department: Optional[str] = "Department of Computer Science"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    full_name: Optional[str]
    department: Optional[str]

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# -- Routes --

@router.post("/register", response_model=AuthTokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    clean_username = sanitize_text(req.username, max_length=50)
    clean_fullname = sanitize_text(req.full_name or "", max_length=100)
    clean_dept = sanitize_text(req.department or "", max_length=100)

    # Restrict publicly selectable role to student or lecturer (admin role cannot be self-assigned)
    requested_role = (req.role or "lecturer").lower().strip()
    if requested_role not in ["lecturer", "student"]:
        requested_role = "lecturer"

    existing = db.query(User).filter(
        (User.email == req.email.lower()) | (User.username == clean_username)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered."
        )

    # Enforce password strength
    if len(req.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )

    user = User(
        username=clean_username,
        email=req.email.lower(),
        hashed_password=hash_password(req.password),
        role=requested_role,
        full_name=clean_fullname or clean_username,
        department=clean_dept or "Department of Academic Studies",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_jwt(user.id, user.role)
    user_resp = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        department=user.department,
    )
    return AuthTokenResponse(access_token=token, user=user_resp)


@router.post("/login", response_model=AuthTokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Seamlessly upgrade legacy plaintext "hashed_" password to strong bcrypt
    if user.hashed_password.startswith("hashed_"):
        user.hashed_password = hash_password(req.password)
        db.commit()

    # Optional role confirmation if user switched views
    if req.role and user.role != req.role.lower():
        # Prevent privilege escalation to admin
        if req.role.lower() in ["student", "lecturer"]:
            user.role = req.role.lower()
            db.commit()

    token = create_jwt(user.id, user.role)
    user_resp = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        department=user.department,
    )
    return AuthTokenResponse(access_token=token, user=user_resp)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        full_name=current_user.full_name,
        department=current_user.department,
    )
