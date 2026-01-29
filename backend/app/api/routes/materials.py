from __future__ import annotations

import os
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.auth import CurrentUser, get_current_admin, get_current_user
from app.core.config import settings
from app.db import get_db
from app.models import Course, Material, MaterialChunk
from app.schemas import MaterialLinkCreate, MaterialOut, MaterialUpdate
from app.services.gemini import GeminiService
from app.services.ingest import extract_text_from_path, simple_chunk

router = APIRouter()


def _ensure_storage_dir() -> str:
    os.makedirs(settings.storage_dir, exist_ok=True)
    return settings.storage_dir


def _material_to_out(m: Material) -> MaterialOut:
    storage_url = None
    if m.storage_path and os.path.exists(m.storage_path):
        storage_url = f"{settings.public_base_url}/materials/{m.id}/file"
    return MaterialOut(
        id=m.id,
        course_id=m.course_id,
        category=m.category,
        title=m.title,
        type=m.type,
        storage_url=storage_url,
        link_url=m.link_url,
        week=m.week,
        topic=m.topic,
        tags=m.tags,
        created_at=m.created_at,
    )


@router.get("", response_model=list[MaterialOut])
@router.get("/", response_model=list[MaterialOut])
def list_materials(
    db: Session = Depends(get_db),
    user: Annotated[CurrentUser, Depends(get_current_user)] = None,
    course_id: uuid.UUID | None = Query(None),
    category: str | None = Query(None),
    type_: str | None = Query(None, alias="type"),
    week: int | None = Query(None),
    topic: str | None = Query(None),
    tags: str | None = Query(None),
):
    _ = user
    if category is not None and category not in ("theory", "lab"):
        raise HTTPException(status_code=400, detail="category must be theory|lab")
    if type_ is not None and type_ not in ("pdf", "slides", "code", "note", "link"):
        raise HTTPException(status_code=400, detail="type must be pdf|slides|code|note|link")
    q = db.query(Material).order_by(Material.created_at.desc())
    if course_id is not None:
        q = q.filter(Material.course_id == course_id)
    if category is not None:
        q = q.filter(Material.category == category)
    if type_ is not None:
        q = q.filter(Material.type == type_)
    if week is not None:
        q = q.filter(Material.week == week)
    if topic is not None:
        q = q.filter(Material.topic.ilike(f"%{topic}%"))
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            q = q.filter(Material.tags.overlap(tag_list))
    items = q.all()
    return [_material_to_out(m) for m in items]


@router.get("/{material_id}", response_model=MaterialOut)
def get_material(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Annotated[CurrentUser, Depends(get_current_user)] = None,
):
    _ = user
    m = db.get(Material, material_id)
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    return _material_to_out(m)


@router.post("/upload", response_model=MaterialOut)
async def upload_material(
    file: UploadFile = File(...),
    course_id: str = Form(...),
    category: str = Form(...),
    title: str = Form(...),
    type: str = Form(...),
    week: int | None = Form(None),
    topic: str | None = Form(None),
    tags: str | None = Form(None),  # comma-separated
    created_by: str | None = Form(None),
    db: Session = Depends(get_db),
    user: Annotated[CurrentUser, Depends(get_current_admin)] = None,
):
    try:
        course_uuid = uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course_id")

    course = db.get(Course, course_uuid)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if category not in {"theory", "lab"}:
        raise HTTPException(status_code=400, detail="category must be theory|lab")

    storage_dir = _ensure_storage_dir()
    material_id = uuid.uuid4()
    filename = file.filename or "upload.bin"
    safe_name = f"{material_id}_{filename}".replace("..", ".")
    dest_path = os.path.join(storage_dir, safe_name)

    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    tag_list = [t.strip() for t in (tags or "").split(",") if t.strip()] or None

    m = Material(
        id=material_id,
        course_id=course_uuid,
        category=category,
        title=title,
        type=type,
        storage_path=dest_path,
        week=week,
        topic=topic,
        tags=tag_list,
        created_by=user.clerk_user_id,
    )
    db.add(m)
    db.commit()
    db.refresh(m)

    return _material_to_out(m)


@router.post("/link", response_model=MaterialOut)
def add_link_material(
    body: MaterialLinkCreate,
    db: Session = Depends(get_db),
    user: Annotated[CurrentUser, Depends(get_current_admin)] = None,
):
    _ = user
    course = db.get(Course, body.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    m = Material(
        course_id=body.course_id,
        category="theory",
        title=body.title,
        type="link",
        storage_path=None,
        link_url=body.link_url,
        week=body.week,
        topic=body.topic,
        tags=body.tags,
        created_by=user.clerk_user_id,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _material_to_out(m)


@router.patch("/{material_id}", response_model=MaterialOut)
def update_material(
    material_id: uuid.UUID,
    body: MaterialUpdate,
    db: Session = Depends(get_db),
    user: Annotated[CurrentUser, Depends(get_current_admin)] = None,
):
    _ = user
    m = db.get(Material, material_id)
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    if body.title is not None:
        m.title = body.title
    if body.category is not None:
        m.category = body.category
    if body.type is not None:
        m.type = body.type
    if body.week is not None:
        m.week = body.week
    if body.topic is not None:
        m.topic = body.topic
    if body.tags is not None:
        m.tags = body.tags
    if body.link_url is not None:
        m.link_url = body.link_url
    db.commit()
    db.refresh(m)
    return _material_to_out(m)


@router.delete("/{material_id}")
def delete_material(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Annotated[CurrentUser, Depends(get_current_admin)] = None,
):
    _ = user
    m = db.get(Material, material_id)
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    if m.storage_path and os.path.exists(m.storage_path):
        try:
            os.remove(m.storage_path)
        except OSError:
            pass
    db.delete(m)
    db.commit()
    return {"ok": True}


@router.get("/{material_id}/file")
def download_material(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Annotated[CurrentUser, Depends(get_current_user)] = None,
):
    _ = user
    m = db.get(Material, material_id)
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    if m.link_url:
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=m.link_url, status_code=302)
    if not m.storage_path or not os.path.exists(m.storage_path):
        raise HTTPException(status_code=404, detail="File missing on server")
    from fastapi.responses import FileResponse
    return FileResponse(path=m.storage_path, filename=os.path.basename(m.storage_path))


@router.post("/{material_id}/ingest")
def ingest_material(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Annotated[CurrentUser, Depends(get_current_admin)] = None,
):
    _ = user
    m = db.get(Material, material_id)
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    if not m.storage_path:
        raise HTTPException(status_code=400, detail="Link-only materials cannot be ingested")

    extracted = extract_text_from_path(m.storage_path)
    chunks = simple_chunk(extracted.text)
    if not chunks:
        raise HTTPException(status_code=400, detail="No extractable text found")

    gemini = GeminiService()
    if not gemini.is_configured():
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not configured")

    embeddings = gemini.embed(chunks)

    # Clear old chunks (re-ingest)
    db.query(MaterialChunk).filter(MaterialChunk.material_id == m.id).delete()
    db.commit()

    for idx, (txt, emb) in enumerate(zip(chunks, embeddings, strict=False)):
        db.add(
            MaterialChunk(
                material_id=m.id,
                chunk_index=idx,
                text=txt,
                embedding=emb,
            )
        )
    db.commit()

    return {"material_id": str(m.id), "chunks_added": len(chunks)}

