from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import GenerateRequest, GenerateResponse
from app.services.gemini import GeminiService
from app.services.search import run_search

router = APIRouter()


def _system_prompt(mode: str) -> str:
    if mode == "theory_notes":
        return (
            "You are a course assistant. Write clean, structured Markdown notes.\n"
            "Rules:\n"
            "- Use headings, bullet points, examples.\n"
            "- ONLY use information supported by the provided SOURCES.\n"
            "- When you state a fact, add a citation marker like [cite:CHUNK_ID].\n"
        )
    if mode == "slides":
        return (
            "You are a course assistant. Create slide content in Markdown (Marp-style).\n"
            "Rules:\n"
            "- Keep each slide concise.\n"
            "- ONLY use information supported by the provided SOURCES.\n"
            "- Add [cite:CHUNK_ID] in speaker notes or near claims.\n"
        )
    if mode == "lab_code":
        return (
            "You are a lab assistant. Produce code-centric learning material.\n"
            "Rules:\n"
            "- Output Markdown.\n"
            "- Include a runnable code example.\n"
            "- Be syntactically correct.\n"
            "- ONLY use patterns from SOURCES.\n"
            "- Add [cite:CHUNK_ID] near explanations.\n"
        )
    return "You are a helpful assistant."


@router.post("", response_model=GenerateResponse)
def generate(req: GenerateRequest, db: Session = Depends(get_db)):
    gemini = GeminiService()
    if not gemini.is_configured():
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not configured")

    q_emb = gemini.embed([req.prompt])[0]
    try:
        rows = run_search(
            db,
            query_embedding=q_emb,
            query_text=req.prompt,
            course_id=req.course_id,
            category=None,
            top_k=6,
            use_hybrid=True,
        )
    except Exception:
        rows = run_search(
            db,
            query_embedding=q_emb,
            query_text="",
            course_id=req.course_id,
            category=None,
            top_k=6,
            use_hybrid=False,
        )

    citations = [r.chunk_id for r in rows]
    sources = []
    for r in rows:
        sources.append(
            {
                "chunk_id": str(r.chunk_id),
                "material_title": r.material_title,
                "category": r.category,
                "text": r.text,
            }
        )

    user = (
        f"USER PROMPT:\n{req.prompt}\n\n"
        f"SOURCES (JSON):\n{json.dumps(sources, ensure_ascii=False)}\n\n"
        "Now produce the requested output."
    )
    md = gemini.generate_markdown(_system_prompt(req.mode), user)

    # Minimal validation: ensure at least one citation marker if we had sources.
    validation = None
    if citations:
        validation = {
            "has_any_citation_marker": "[cite:" in md,
            "retrieved_chunks": [str(c) for c in citations],
        }

    return GenerateResponse(content_markdown=md, citations=citations, validation=validation)

