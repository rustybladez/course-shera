from __future__ import annotations

import os
import sys
import uuid

# Add backend directory to Python path so we can import app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text

from app.core.config import settings
from app.db import SessionLocal, engine, init_extensions
from app.models import Base, Course, Material


def main() -> None:
    init_extensions()
    Base.metadata.create_all(bind=engine)

    storage_dir = settings.storage_dir
    os.makedirs(storage_dir, exist_ok=True)

    sample_path = os.path.join(os.path.dirname(__file__), "..", "samples", "intro_note.md")
    sample_path = os.path.abspath(sample_path)
    if not os.path.exists(sample_path):
        raise RuntimeError(f"Missing sample file: {sample_path}")

    with SessionLocal() as db:
        course = Course(title="Demo Course: AI-Powered Learning", code="DEMO101", term="Spring 2026")
        db.add(course)
        db.commit()
        db.refresh(course)

        # Copy sample file into storage so the download endpoint works.
        material_id = uuid.uuid4()
        dest_path = os.path.join(storage_dir, f"{material_id}_intro_note.md")
        with open(sample_path, "rb") as src, open(dest_path, "wb") as dst:
            dst.write(src.read())

        mat = Material(
            id=material_id,
            course_id=course.id,
            category="theory",
            title="Week 1: Course Overview (sample)",
            type="note",
            storage_path=dest_path,
            week=1,
            topic="overview",
            tags=["demo", "week1"],
            created_by="seed",
        )
        db.add(mat)
        db.commit()

        # Helpful message for teammates
        print("Seeded:")
        print(f"- course_id: {course.id}")
        print(f"- material_id: {mat.id}")
        print("")
        print("Next:")
        print(f"- Ingest: POST /materials/{mat.id}/ingest")
        print("- Search: POST /search")


if __name__ == "__main__":
    main()

