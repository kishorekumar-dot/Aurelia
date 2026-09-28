from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.database.models import User

router = APIRouter()

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "lecturer"
    full_name: Optional[str] = "Academic User"
    department: Optional[str] = "Department of Computer Science"

class LoginRequest(BaseModel):
    email: str
    password: str
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

@router.post("/register", response_model=AuthTokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.email == req.email) | (User.username == req.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=f"hashed_{req.password}",
        role=req.role or ("student" if "student" in req.email.lower() else "lecturer"),
        full_name=req.full_name,
        department=req.department
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    user_resp = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        department=user.department
    )
    return AuthTokenResponse(access_token=f"jwt_token_user_{user.id}", user=user_resp)

@router.post("/login", response_model=AuthTokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        determined_role = req.role or ("student" if "student" in req.email.lower() or "rivera" in req.email.lower() else "lecturer")
        full_name = "Alex Rivera (Student Candidate)" if determined_role == "student" else "Dr. Evelyn Chen"
        user = User(
            username=req.email.split("@")[0],
            email=req.email,
            hashed_password="hashed_demo",
            role=determined_role,
            full_name=full_name,
            department="Department of Computer Science & Technology"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif req.role and user.role != req.role:
        user.role = req.role
        db.commit()

    user_resp = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        department=user.department
    )
    return AuthTokenResponse(access_token=f"jwt_token_user_{user.id}", user=user_resp)


@router.get("/me", response_model=UserResponse)
def get_current_user(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(
            username="dr.chen",
            email="dr.chen@cambridge.edu",
            hashed_password="hashed_academic123",
            role="lecturer",
            full_name="Dr. Evelyn Chen",
            department="Department of Computer Science & Technology"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        department=user.department
    )
