from __future__ import annotations

import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_extensions() -> None:
    # pgvector extension
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    except Exception:
        # Some hosted DBs restrict CREATE EXTENSION; don't crash the app for MVP.
        logger.exception("Failed to ensure pgvector extension; search may not work.")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

