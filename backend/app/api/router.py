from fastapi import APIRouter

from app.api.routes import auth, chat, courses, generate, health, materials, search

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(generate.router, prefix="/generate", tags=["generate"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])

