from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db import engine, init_extensions
from app.models import Base


def _ensure_storage_dir() -> None:
    os.makedirs(settings.storage_dir, exist_ok=True)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def _startup() -> None:
        _ensure_storage_dir()
        init_extensions()
        Base.metadata.create_all(bind=engine)

    app.include_router(api_router)
    return app


app = create_app()

