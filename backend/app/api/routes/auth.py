from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.auth import (
    CurrentUser,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db import get_db
from app.models import Profile
from app.schemas import MeOut

router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    role: str


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, db: Annotated[Session, Depends(get_db)]):
    """Register a new user."""
    # Check if user already exists
    existing = db.query(Profile).filter(Profile.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user (all new users are students by default)
    profile = Profile(
        email=data.email,
        password_hash=hash_password(data.password),
        role="student",
        name=data.name,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    # Generate token
    token = create_access_token(str(profile.id), profile.role)

    return AuthResponse(
        access_token=token,
        user_id=str(profile.id),
        role=profile.role,
    )


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    """Login with email and password."""
    # Find user
    profile = db.query(Profile).filter(Profile.email == data.email).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if not verify_password(data.password, profile.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Generate token
    token = create_access_token(str(profile.id), profile.role)

    return AuthResponse(
        access_token=token,
        user_id=str(profile.id),
        role=profile.role,
    )


@router.get("/me", response_model=MeOut)
async def me(user: Annotated[CurrentUser, Depends(get_current_user)]):
    """Get current user info."""
    return MeOut(user_id=user.user_id, role=user.role)
