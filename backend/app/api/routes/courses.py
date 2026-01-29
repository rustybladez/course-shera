from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import CurrentUser, get_current_admin, get_current_user
from app.db import get_db
from app.models import Course
from app.schemas import CourseCreate, CourseOut

router = APIRouter()


@router.get("", response_model=list[CourseOut])
@router.get("/", response_model=list[CourseOut])
def list_courses(
    db: Session = Depends(get_db),
    user: Annotated[CurrentUser, Depends(get_current_user)] = None,
):
    _ = user
    rows = db.query(Course).order_by(Course.created_at.desc()).all()
    return [
        CourseOut(
            id=c.id,
            title=c.title,
            code=c.code,
            term=c.term,
            created_at=c.created_at,
        )
        for c in rows
    ]


@router.post("", response_model=CourseOut)
def create_course(
    req: CourseCreate,
    db: Session = Depends(get_db),
    user: Annotated[CurrentUser, Depends(get_current_admin)] = None,
):
    _ = user
    c = Course(title=req.title, code=req.code, term=req.term)
    db.add(c)
    db.commit()
    db.refresh(c)
    return CourseOut(
        id=c.id,
        title=c.title,
        code=c.code,
        term=c.term,
        created_at=c.created_at,
    )

