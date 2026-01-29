from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import ChatMessage, ChatThread
from app.schemas import (
    ChatCreateThreadRequest,
    ChatMessageIn,
    ChatMessageOut,
    ChatThreadOut,
)
from app.services.gemini import GeminiService

router = APIRouter()


def _default_user_id() -> str:
    # Hackathon MVP: replace with Clerk auth later.
    return "demo-user"


@router.post("/threads", response_model=ChatThreadOut)
def create_thread(req: ChatCreateThreadRequest, db: Session = Depends(get_db)):
    t = ChatThread(course_id=req.course_id, user_id=_default_user_id(), title=req.title)
    db.add(t)
    db.commit()
    db.refresh(t)
    return ChatThreadOut(id=t.id, course_id=t.course_id, title=t.title)


@router.get("/threads/{thread_id}/messages", response_model=list[ChatMessageOut])
def list_messages(thread_id: uuid.UUID, db: Session = Depends(get_db)):
    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.thread_id == thread_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [
        ChatMessageOut(
            id=m.id,
            role=m.role,
            content=m.content,
            citations_json=m.citations_json,
            created_at=m.created_at,
        )
        for m in msgs
    ]


@router.post("/threads/{thread_id}/messages", response_model=ChatMessageOut)
def send_message(thread_id: uuid.UUID, req: ChatMessageIn, db: Session = Depends(get_db)):
    thread = db.get(ChatThread, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Save user message
    um = ChatMessage(thread_id=thread_id, role="user", content=req.content)
    db.add(um)
    db.commit()
    db.refresh(um)

    # Simple “chat” MVP: just respond via Gemini with a short context window from history.
    gemini = GeminiService()
    if not gemini.is_configured():
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not configured")

    last = (
        db.query(ChatMessage)
        .filter(ChatMessage.thread_id == thread_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(8)
        .all()
    )
    last = list(reversed(last))
    convo = [{"role": m.role, "content": m.content} for m in last]

    system = (
        "You are a course assistant chatbot.\n"
        "For hackathon MVP, answer concisely.\n"
        "If the user asks to 'search' or 'generate', instruct them to use the UI buttons (we'll add tool-calling next)."
    )
    user = f"CONVERSATION (JSON):\n{json.dumps(convo, ensure_ascii=False)}\n\nRespond to the last user message."
    assistant_text = gemini.generate_markdown(system, user)

    am = ChatMessage(thread_id=thread_id, role="assistant", content=assistant_text)
    db.add(am)
    db.commit()
    db.refresh(am)

    return ChatMessageOut(
        id=am.id,
        role=am.role,
        content=am.content,
        citations_json=am.citations_json,
        created_at=am.created_at,
    )

