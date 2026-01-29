from __future__ import annotations

import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.models import Course, Material, MaterialChunk
from app.schemas import MaterialOut
from app.services.gemini import GeminiService
from app.services.ingest import extract_text_from_path, simple_chunk

router = APIRouter()


def _ensure_storage_dir() -> str:
    os.makedirs(settings.storage_dir, exist_ok=True)
    return settings.storage_dir


@router.get("/")
def list_materials(db: Session = Depends(get_db)):
    items = db.query(Material).order_by(Material.created_at.desc()).all()
    return [
        MaterialOut(
            id=m.id,
            course_id=m.course_id,
            category=m.category,
            title=m.title,
            type=m.type,
            storage_url=f"{settings.public_base_url}/materials/{m.id}/file",
            week=m.week,
            topic=m.topic,
            tags=m.tags,
            created_at=m.created_at,
        )
        for m in items
    ]


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
        created_by=created_by,
    )
    db.add(m)
    db.commit()
    db.refresh(m)

    return MaterialOut(
        id=m.id,
        course_id=m.course_id,
        category=m.category,
        title=m.title,
        type=m.type,
        storage_url=f"{settings.public_base_url}/materials/{m.id}/file",
        week=m.week,
        topic=m.topic,
        tags=m.tags,
        created_at=m.created_at,
    )


@router.get("/{material_id}/file")
def download_material(material_id: uuid.UUID, db: Session = Depends(get_db)):
    m = db.get(Material, material_id)
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    if not os.path.exists(m.storage_path):
        raise HTTPException(status_code=404, detail="File missing on server")

    # Simple file return without streaming optimizations (MVP).
    from fastapi.responses import FileResponse

    return FileResponse(path=m.storage_path, filename=os.path.basename(m.storage_path))


@router.post("/{material_id}/ingest")
def ingest_material(material_id: uuid.UUID, db: Session = Depends(get_db)):
    m = db.get(Material, material_id)
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")

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

